import { z } from "zod";
import type { PaymentMethod } from "@prisma/client";
import type { CartLine } from "@/lib/store/useCart";
import type { CheckoutShippingInput } from "@/lib/validations/checkout";
import { CART_MAX_LINE_QUANTITY, CART_MAX_LINES, cartResponseSchema } from "@/lib/validations/cart";
import type { CartData, CartReplaceBody, CheckoutStockIssue } from "@/types/cart";

/**
 * Browser-side helpers for talking to `/api/cart` and `/api/checkout`.
 * No Prisma/Stripe/auth imports here - this file is imported by Client Components.
 * Every helper resolves (never throws) so callers can `console.warn` and move on.
 */

export const CART_API = "/api/cart";
export const CHECKOUT_API = "/api/checkout";

export type CartApiResult =
  { ok: true; cart: CartData } | { ok: false; status: number; error: string };

const apiErrorSchema = z.object({ error: z.string() });

/** Extract a human-readable message from an error response without trusting its shape. */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  const json: unknown = await response.json().catch(() => null);
  const parsed = apiErrorSchema.safeParse(json);
  return parsed.success ? parsed.data.error : fallback;
}

/** Reduce store lines to the id/quantity pairs the server accepts (deduped, clamped, capped). */
export function toCartReplaceBody(items: readonly CartLine[]): CartReplaceBody {
  const quantities = new Map<string, number>();
  for (const line of items) {
    const quantity = Math.min(
      Math.max(quantities.get(line.productId) ?? 0, Math.floor(line.quantity)),
      CART_MAX_LINE_QUANTITY,
    );
    if (quantity >= 1) quantities.set(line.productId, quantity);
  }
  return {
    items: [...quantities.entries()]
      .slice(0, CART_MAX_LINES)
      .map(([productId, quantity]) => ({ productId, quantity })),
  };
}

async function parseCartResponse(response: Response, fallback: string): Promise<CartApiResult> {
  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: await readApiError(response, fallback),
    };
  }
  const json: unknown = await response.json().catch(() => null);
  const parsed = cartResponseSchema.safeParse(json);
  if (!parsed.success) {
    return { ok: false, status: response.status, error: "Unexpected response from cart API" };
  }
  return { ok: true, cart: parsed.data.data };
}

/** GET the signed-in user's server cart. `status: 0` means the network request itself failed. */
export async function fetchServerCart(): Promise<CartApiResult> {
  try {
    const response = await fetch(CART_API, { method: "GET", cache: "no-store" });
    return await parseCartResponse(response, "Failed to load cart");
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/** PUT the given lines as the whole server cart. Returns the canonical cart the server stored. */
export async function pushServerCart(items: readonly CartLine[]): Promise<CartApiResult> {
  try {
    const response = await fetch(CART_API, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toCartReplaceBody(items)),
      cache: "no-store",
    });
    return await parseCartResponse(response, "Failed to save cart");
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ───────────────────────────── Checkout ─────────────────────────────

/** Everything POST /api/checkout needs beyond the cart lines. */
export type CheckoutRequest = {
  email: string;
  shipping: CheckoutShippingInput;
  paymentMethod: PaymentMethod;
  /** Transaction id for eSewa / IME Pay / bank transfers. */
  paymentReference?: string;
  saveAddress?: boolean;
};

const checkoutStartedSchema = z.object({
  data: z.object({
    orderId: z.string().min(1),
    orderNumber: z.string().optional(),
    paymentMethod: z.string(),
    url: z.string().url().optional(),
    redirectTo: z.string().min(1),
  }),
});

const checkoutStockConflictSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      title: z.string().optional(),
      available: z.number().int().min(0),
    }),
  ),
});

const checkoutUnavailableSchema = z.object({
  productIds: z.array(z.string()).optional(),
  items: z.array(z.object({ productId: z.string() })).optional(),
});

const issuesSchema = z.object({
  issues: z.array(
    z.object({ path: z.array(z.union([z.string(), z.number()])), message: z.string() }),
  ),
});

/** Field errors keyed like the form inputs: "email", "shipping.postalCode", "paymentReference". */
export type CheckoutFieldErrors = Record<string, string[]>;

export type CheckoutOutcome =
  /** Card payment: send the browser to Stripe. */
  | { kind: "redirect"; url: string }
  /** Manual payment: the order exists already; go to its confirmation page. */
  | { kind: "placed"; orderId: string; redirectTo: string }
  | { kind: "payments-unavailable"; message: string }
  | { kind: "insufficient-stock"; items: CheckoutStockIssue[] }
  | { kind: "unavailable"; productIds: string[] }
  | { kind: "invalid"; message: string; fieldErrors: CheckoutFieldErrors }
  | { kind: "error"; message: string };

const GENERIC_CHECKOUT_ERROR = "Unable to place your order. Please try again.";

/** Zod issue paths -> dotted form field keys, keeping every message for a field. */
export function issuesToFieldErrors(
  issues: readonly { path: readonly (string | number)[]; message: string }[],
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.join(".") || "form";
    const existing = errors[key];
    if (existing) existing.push(issue.message);
    else errors[key] = [issue.message];
  }
  return errors;
}

/**
 * POST /api/checkout with the current lines plus the checkout form, and classify the response:
 * 201 -> Stripe redirect or a placed order, 503 -> card payments off, 409 -> stock conflicts,
 * 400 -> unavailable products or field errors.
 */
export async function startCheckout(
  items: readonly CartLine[],
  request: CheckoutRequest,
): Promise<CheckoutOutcome> {
  let response: Response;
  try {
    response = await fetch(CHECKOUT_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...toCartReplaceBody(items),
        email: request.email,
        shipping: request.shipping,
        paymentMethod: request.paymentMethod,
        ...(request.paymentReference ? { paymentReference: request.paymentReference } : {}),
        saveAddress: request.saveAddress ?? false,
      }),
      cache: "no-store",
    });
  } catch {
    return { kind: "error", message: "Network error. Check your connection and try again." };
  }

  const json: unknown = await response.json().catch(() => null);

  if (response.ok) {
    const parsed = checkoutStartedSchema.safeParse(json);
    if (!parsed.success) return { kind: "error", message: GENERIC_CHECKOUT_ERROR };
    const { url, orderId, redirectTo } = parsed.data.data;
    return url ? { kind: "redirect", url } : { kind: "placed", orderId, redirectTo };
  }

  if (response.status === 503) {
    const parsedError = apiErrorSchema.safeParse(json);
    return {
      kind: "payments-unavailable",
      message: parsedError.success
        ? parsedError.data.error
        : "That payment method is not available right now.",
    };
  }

  if (response.status === 409) {
    const parsed = checkoutStockConflictSchema.safeParse(json);
    if (parsed.success && parsed.data.items.length > 0) {
      return { kind: "insufficient-stock", items: parsed.data.items };
    }
  }

  if (response.status === 400) {
    const unavailable = checkoutUnavailableSchema.safeParse(json);
    if (unavailable.success) {
      const productIds = [
        ...(unavailable.data.productIds ?? []),
        ...(unavailable.data.items ?? []).map((item) => item.productId),
      ];
      if (productIds.length > 0) return { kind: "unavailable", productIds };
    }

    const invalid = issuesSchema.safeParse(json);
    if (invalid.success && invalid.data.issues.length > 0) {
      return {
        kind: "invalid",
        message: "Please check the highlighted fields.",
        fieldErrors: issuesToFieldErrors(invalid.data.issues),
      };
    }
  }

  const parsedError = apiErrorSchema.safeParse(json);
  return {
    kind: "error",
    message: parsedError.success ? parsedError.data.error : GENERIC_CHECKOUT_ERROR,
  };
}
