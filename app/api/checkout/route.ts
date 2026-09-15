import { NextResponse, type NextRequest } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { isManualPaymentMethod, isPaymentMethodAvailable } from "@/lib/payments/methods";
import {
  placeManualOrder,
  priceCart,
  saveCheckoutAddress,
  startStripeCheckout,
  toOrderDraft,
} from "@/lib/orders/place";
import { checkoutSchema } from "@/lib/validations/checkout";

/** Per-IP limit on checkout submissions (each call creates an Order). */
const CHECKOUT_RATE_LIMIT = { limit: 10, windowMs: 60_000 } as const;

/**
 * POST /api/checkout
 * Body: { items, email, shipping, paymentMethod, paymentReference?, saveAddress? }
 *
 * 1. Validate the body (Zod) and rate limit by IP.
 * 2. Re-read products from the DB (prices, stock, active flag) - never trust the client.
 * 3. Card payments (`STRIPE`): create a PENDING order + Stripe Checkout Session, return its URL.
 *    Payment confirmation happens in /api/webhooks/stripe (checkout.session.completed).
 * 4. Manual methods (cash on delivery, eSewa, IME Pay, bank transfer): reserve stock, place the
 *    order and return it. An admin confirms the payment later from /admin/orders/[id].
 *
 * Responses: 201 { data: { orderId, orderNumber?, paymentMethod, url?, redirectTo } },
 * 400 validation / unavailable products, 409 insufficient stock, 429 rate limited,
 * 503 card payments requested while Stripe is unconfigured.
 */
export async function POST(request: NextRequest) {
  const limit = rateLimit(`checkout:${getClientIp(request)}`, CHECKOUT_RATE_LIMIT);
  if (!limit.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  if (!isPaymentMethodAvailable(input.paymentMethod, { stripeConfigured: isStripeConfigured })) {
    return NextResponse.json(
      {
        error:
          "Card payments are not configured in this environment. Choose cash on delivery, eSewa, IME Pay or bank transfer.",
      },
      { status: 503 },
    );
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  try {
    const priced = await priceCart(input.items);

    if (!priced.ok && priced.code === "unavailable") {
      return NextResponse.json(
        { error: "Some products are unavailable", productIds: priced.productIds },
        { status: 400 },
      );
    }
    if (!priced.ok) {
      return NextResponse.json(
        { error: "Insufficient stock", items: priced.items },
        { status: 409 },
      );
    }

    const draft = toOrderDraft(input, priced.cart, userId);

    if (!isManualPaymentMethod(input.paymentMethod)) {
      const { url, orderId } = await startStripeCheckout(draft);
      if (userId && input.saveAddress) await saveCheckoutAddress(userId, input.shipping);

      return NextResponse.json(
        { data: { orderId, paymentMethod: input.paymentMethod, url, redirectTo: url } },
        { status: 201 },
      );
    }

    const placed = await placeManualOrder(draft);
    if (!placed.ok) {
      return NextResponse.json(
        { error: "Insufficient stock", items: placed.items },
        { status: 409 },
      );
    }

    if (userId && input.saveAddress) await saveCheckoutAddress(userId, input.shipping);

    return NextResponse.json(
      {
        data: {
          orderId: placed.orderId,
          orderNumber: placed.orderNumber,
          paymentMethod: input.paymentMethod,
          redirectTo: `/checkout/success?order_id=${placed.orderId}`,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/checkout]", error);
    return NextResponse.json({ error: "Unable to place your order" }, { status: 500 });
  }
}
