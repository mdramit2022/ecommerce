import { Prisma, type PaymentMethod } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { stripe, toMinorUnits } from "@/lib/stripe";
import { createUserAddress } from "@/lib/account/addresses";
import { isManualPaymentMethod } from "@/lib/payments/methods";
import { SHIPPING_COUNTRY_CODES } from "@/lib/payments/countries";
import {
  buildPricedCart,
  mergeQuantities,
  missingProductIds,
  stockIssues,
  type PricedCart,
  type StockIssue,
} from "@/lib/orders/pricing";
import { loadOrderDetail, sendOrderConfirmation } from "@/lib/orders/notify";
import { generateOrderNumber } from "@/lib/utils";
import type { CheckoutInput, CheckoutShippingInput } from "@/lib/validations/checkout";

/**
 * Placing an order. Server only - imports Prisma, Stripe and env.
 *
 * Two paths share the same pricing and the same order row:
 *
 *   - Stripe (`startStripeCheckout`): the order is created PENDING/UNPAID and the customer is sent
 *     to Stripe. Stock is only decremented when the payment lands (`lib/orders/fulfill.ts`).
 *   - Manual (`placeManualOrder`): cash on delivery, eSewa, IME Pay and bank transfer have no
 *     provider to redirect to, so the order is placed immediately and stock is reserved in the
 *     same transaction. An admin confirms the money later.
 *
 * Prices, stock and totals are always re-read from the database; the client only supplies
 * product ids and quantities.
 */

/** Lowercase ISO 4217 code written on every new order. Display formatting: `formatPrice`. */
export const ORDER_CURRENCY = "npr";

/** Allowed shipping destinations for Stripe Checkout's own address step. */
export const STRIPE_SHIPPING_COUNTRIES =
  SHIPPING_COUNTRY_CODES satisfies readonly Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[];

export type { PricedCart, PricedLine, StockIssue } from "@/lib/orders/pricing";

export type PriceCartResult =
  | { ok: true; cart: PricedCart }
  | { ok: false; code: "unavailable"; productIds: string[] }
  | { ok: false; code: "insufficient-stock"; items: StockIssue[] };

/**
 * Re-read the requested products and build the order lines from database prices.
 * The client is only trusted for product ids and quantities.
 */
export async function priceCart(
  items: readonly { productId: string; quantity: number }[],
): Promise<PriceCartResult> {
  const quantities = mergeQuantities(items);
  const productIds = [...quantities.keys()];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, title: true, price: true, stock: true, images: true },
  });

  const missing = missingProductIds(productIds, products);
  if (missing.length > 0) {
    return { ok: false, code: "unavailable", productIds: missing };
  }

  const issues = stockIssues(products, quantities);
  if (issues.length > 0) {
    return { ok: false, code: "insufficient-stock", items: issues };
  }

  return { ok: true, cart: buildPricedCart(productIds, products, quantities) };
}

export type OrderDraft = {
  userId: string | null;
  email: string;
  paymentMethod: PaymentMethod;
  paymentReference: string | null;
  shipping: CheckoutShippingInput;
  cart: PricedCart;
};

/** Shape the validated checkout body into a draft, pairing it with server-priced lines. */
export function toOrderDraft(
  input: CheckoutInput,
  cart: PricedCart,
  userId: string | null,
): OrderDraft {
  return {
    userId,
    email: input.email,
    paymentMethod: input.paymentMethod,
    paymentReference: input.paymentReference ?? null,
    shipping: input.shipping,
    cart,
  };
}

function orderCreateData(draft: OrderDraft): Prisma.OrderUncheckedCreateInput {
  const { cart, shipping } = draft;
  return {
    orderNumber: generateOrderNumber(),
    userId: draft.userId,
    email: draft.email,
    paymentMethod: draft.paymentMethod,
    paymentReference: draft.paymentReference,
    subtotal: cart.subtotal,
    shippingCost: cart.shippingCost,
    tax: cart.tax,
    total: cart.total,
    currency: ORDER_CURRENCY,
    shippingName: shipping.fullName,
    shippingLine1: shipping.line1,
    shippingLine2: shipping.line2 ?? null,
    shippingCity: shipping.city,
    shippingState: shipping.state ?? null,
    shippingPostalCode: shipping.postalCode,
    shippingCountry: shipping.country,
    shippingPhone: shipping.phone,
    items: {
      createMany: {
        data: cart.lines.map((line) => ({
          productId: line.productId,
          title: line.title,
          image: line.image,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
        })),
      },
    },
  };
}

/** Thrown inside the placement transaction so the whole order is rolled back. */
class StockConflictError extends Error {
  constructor(readonly productId: string) {
    super(`Insufficient stock for product ${productId}`);
    this.name = "StockConflictError";
  }
}

export type PlaceOrderResult =
  | { ok: true; orderId: string; orderNumber: string; emailSent: boolean }
  | { ok: false; code: "insufficient-stock"; items: StockIssue[] };

/**
 * Place an order paid by a manual method. Idempotency is the caller's problem (one POST = one
 * order); atomicity is ours:
 *
 * 1. Decrement stock with a conditional `updateMany`, so two customers cannot buy the last unit.
 * 2. Create the PENDING / UNPAID order with its price and address snapshots.
 * 3. Empty the signed-in customer's server-side cart.
 *
 * Any stock conflict rolls the whole transaction back and is reported to the caller.
 * The confirmation email is sent afterwards and never blocks the order.
 */
export async function placeManualOrder(draft: OrderDraft): Promise<PlaceOrderResult> {
  if (!isManualPaymentMethod(draft.paymentMethod)) {
    throw new Error(`placeManualOrder called with online method ${draft.paymentMethod}`);
  }

  let created: { id: string; orderNumber: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      for (const line of draft.cart.lines) {
        const updated = await tx.product.updateMany({
          where: { id: line.productId, isActive: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (updated.count === 0) throw new StockConflictError(line.productId);
      }

      const order = await tx.order.create({
        data: orderCreateData(draft),
        select: { id: true, orderNumber: true },
      });

      if (draft.userId) {
        const cart = await tx.cart.findUnique({
          where: { userId: draft.userId },
          select: { id: true },
        });
        if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return order;
    });
  } catch (error) {
    if (error instanceof StockConflictError) {
      const product = await prisma.product.findUnique({
        where: { id: error.productId },
        select: { title: true, stock: true, isActive: true },
      });
      return {
        ok: false,
        code: "insufficient-stock",
        items: [
          {
            productId: error.productId,
            title: product?.title ?? "An item in your cart",
            available: product?.isActive ? product.stock : 0,
          },
        ],
      };
    }
    throw error;
  }

  const detail = await loadOrderDetail(created.id);
  const emailSent = detail ? await sendOrderConfirmation(detail) : false;

  return { ok: true, orderId: created.id, orderNumber: created.orderNumber, emailSent };
}

export type StripeCheckoutResult = { url: string; orderId: string };

/**
 * Create the pending order and the Stripe Checkout Session for it. Stock is not touched here -
 * `lib/orders/fulfill.ts` reserves it when the payment is confirmed.
 */
export async function startStripeCheckout(draft: OrderDraft): Promise<StripeCheckoutResult> {
  const order = await prisma.order.create({
    data: orderCreateData(draft),
    select: { id: true, orderNumber: true },
  });

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = draft.cart.lines.map(
    (line) => ({
      quantity: line.quantity,
      price_data: {
        currency: ORDER_CURRENCY,
        unit_amount: toMinorUnits(line.unitPrice.toNumber()),
        product_data: {
          name: line.title,
          ...(line.image ? { images: [line.image] } : {}),
          metadata: { productId: line.productId },
        },
      },
    }),
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: draft.email,
    shipping_address_collection: { allowed_countries: [...STRIPE_SHIPPING_COUNTRIES] },
    phone_number_collection: { enabled: true },
    success_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/checkout/cancel?order_id=${order.id}`,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      ...(draft.userId ? { userId: draft.userId } : {}),
    },
    // Copied onto the PaymentIntent (and its Charges) so refund / failure webhooks can find the order.
    payment_intent_data: { metadata: { orderId: order.id, orderNumber: order.orderNumber } },
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
  });

  if (!checkoutSession.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return { url: checkoutSession.url, orderId: order.id };
}

/**
 * Save the checkout address to a signed-in customer's address book. Best effort: a failure here
 * must never fail an order that has already been placed.
 */
export async function saveCheckoutAddress(
  userId: string,
  shipping: CheckoutShippingInput,
): Promise<void> {
  try {
    await createUserAddress(userId, {
      fullName: shipping.fullName,
      line1: shipping.line1,
      line2: shipping.line2 ?? null,
      city: shipping.city,
      state: shipping.state ?? null,
      postalCode: shipping.postalCode,
      country: shipping.country,
      phone: shipping.phone,
      isDefault: false,
    });
  } catch (error) {
    console.error("[orders] could not save the checkout address", error);
  }
}
