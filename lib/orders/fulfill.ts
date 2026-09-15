import type { Prisma } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { isStripeConfigured, stripe } from "@/lib/stripe";
import {
  PENDING_EMAIL_PLACEHOLDER,
  loadOrderDetail,
  sendOrderConfirmation,
} from "@/lib/orders/notify";
import type { OrderDetail } from "@/types/order";

/**
 * Order lifecycle transitions driven by Stripe Checkout.
 *
 * Every function here is safe to call more than once (webhook retries, the success page
 * racing the webhook): the DB row is the source of truth and each write is guarded by a
 * conditional `updateMany` so a second caller becomes a no-op.
 *
 * Server only - never import from a Client Component.
 */

export { PENDING_EMAIL_PLACEHOLDER };

const locateSelect = {
  id: true,
  orderNumber: true,
  userId: true,
  email: true,
  status: true,
  paymentStatus: true,
  stripeSessionId: true,
  items: { select: { productId: true, quantity: true, title: true } },
} satisfies Prisma.OrderSelect;

type LocatedOrder = Prisma.OrderGetPayload<{ select: typeof locateSelect }>;

/** Find the order for a Checkout Session: by `stripeSessionId`, then metadata / client_reference_id. */
async function locateOrderForSession(
  session: Stripe.Checkout.Session,
): Promise<LocatedOrder | null> {
  const bySession = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: locateSelect,
  });
  if (bySession) return bySession;

  const fallbackId = session.metadata?.orderId ?? session.client_reference_id;
  if (!fallbackId) return null;

  return prisma.order.findUnique({ where: { id: fallbackId }, select: locateSelect });
}

function paymentIntentIdOf(ref: string | Stripe.PaymentIntent | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

/**
 * `Order.stripePaymentIntentId` is unique. With real Stripe data one PaymentIntent maps to one
 * session and one order, but a stale or replayed id must never make a paid order un-fulfillable
 * (a constraint error would abort the transaction and keep the webhook failing). If another
 * order already holds the id, log loudly and leave the column untouched.
 */
async function resolvePaymentIntentId(
  orderId: string,
  paymentIntentId: string | null,
): Promise<string | null> {
  if (!paymentIntentId) return null;
  const holder = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true },
  });
  if (holder && holder.id !== orderId) {
    console.error(
      `[orders] PaymentIntent ${paymentIntentId} already belongs to order ${holder.id}; not linking it to ${orderId}`,
    );
    return null;
  }
  return paymentIntentId;
}

/**
 * Shipping snapshot from a Checkout Session. Stripe v17 exposes the collected address on
 * `session.shipping_details` (older API versions) and `session.collected_information.shipping_details`
 * (newer ones); phone lives on `customer_details`. Everything can be null, so only set what we have.
 */
function shippingSnapshotOf(session: Stripe.Checkout.Session): Prisma.OrderUpdateManyMutationInput {
  const details =
    session.shipping_details ?? session.collected_information?.shipping_details ?? null;
  const address = details?.address ?? null;
  const snapshot: Prisma.OrderUpdateManyMutationInput = {};

  const name = details?.name ?? session.customer_details?.name ?? null;
  const phone = session.customer_details?.phone ?? details?.phone ?? null;

  if (name) snapshot.shippingName = name;
  if (address?.line1) snapshot.shippingLine1 = address.line1;
  if (address?.line2) snapshot.shippingLine2 = address.line2;
  if (address?.city) snapshot.shippingCity = address.city;
  if (address?.state) snapshot.shippingState = address.state;
  if (address?.postal_code) snapshot.shippingPostalCode = address.postal_code;
  if (address?.country) snapshot.shippingCountry = address.country;
  if (phone) snapshot.shippingPhone = phone;

  return snapshot;
}

export type FulfillOrderResult =
  | { outcome: "not-found"; alreadyFulfilled: false; orderId: null }
  | { outcome: "already-fulfilled"; alreadyFulfilled: true; orderId: string }
  | {
      outcome: "fulfilled";
      alreadyFulfilled: false;
      orderId: string;
      order: OrderDetail;
      emailSent: boolean;
    };

/**
 * Mark an order paid from a completed Checkout Session. Idempotent.
 *
 * In one transaction: status/paymentStatus -> PAID, store the PaymentIntent id, replace the
 * placeholder email, copy the shipping snapshot, decrement stock (never below zero) and empty
 * the customer's server-side cart. Then send the confirmation email (failures are logged only).
 */
export async function fulfillOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<FulfillOrderResult> {
  const order = await locateOrderForSession(session);
  if (!order) {
    console.warn(`[orders] no order found for Checkout Session ${session.id}`);
    return { outcome: "not-found", alreadyFulfilled: false, orderId: null };
  }
  if (order.paymentStatus === "PAID") {
    return { outcome: "already-fulfilled", alreadyFulfilled: true, orderId: order.id };
  }

  const paymentIntentId = await resolvePaymentIntentId(
    order.id,
    paymentIntentIdOf(session.payment_intent),
  );
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? null;

  const data: Prisma.OrderUpdateManyMutationInput = {
    status: "PAID",
    paymentStatus: "PAID",
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    ...(order.stripeSessionId ? {} : { stripeSessionId: session.id }),
    ...(customerEmail ? { email: customerEmail } : {}),
    ...shippingSnapshotOf(session),
  };

  const claimed = await prisma.$transaction(async (tx) => {
    // Conditional update = the idempotency lock. A concurrent caller sees count 0 and stops.
    const updated = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "PAID" } },
      data,
    });
    if (updated.count === 0) return false;

    for (const item of order.items) {
      const stock = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (stock.count === 0) {
        console.warn(
          `[orders] ${order.orderNumber}: insufficient stock to decrement "${item.title}" (${item.productId}) by ${item.quantity}; order fulfilled anyway - review inventory`,
        );
      }
    }

    if (order.userId) {
      const cart = await tx.cart.findUnique({
        where: { userId: order.userId },
        select: { id: true },
      });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return true;
  });

  if (!claimed) {
    return { outcome: "already-fulfilled", alreadyFulfilled: true, orderId: order.id };
  }

  const detail = await loadOrderDetail(order.id);
  if (!detail) {
    // Cannot happen (we just updated the row); guard for type safety.
    throw new Error(`Order ${order.id} disappeared after fulfilment`);
  }

  const emailSent = await sendOrderConfirmation(detail);
  return {
    outcome: "fulfilled",
    alreadyFulfilled: false,
    orderId: order.id,
    order: detail,
    emailSent,
  };
}

/** Cancel a still-pending order. Used by both the expired-session webhook and the cancel page. */
export async function cancelPendingOrder(orderId: string): Promise<{ cancelled: boolean }> {
  const result = await prisma.order.updateMany({
    // Stripe orders only: manual orders reserve stock at placement, so cancelling one has to
    // restock it (lib/admin/orders.ts). Nothing in the Stripe flow may silently cancel those.
    where: { id: orderId, status: "PENDING", paymentStatus: "UNPAID", paymentMethod: "STRIPE" },
    data: { status: "CANCELLED" },
  });
  return { cancelled: result.count > 0 };
}

/** `checkout.session.expired`: the customer never paid - cancel the order if it is still PENDING/UNPAID. */
export async function cancelExpiredCheckout(
  session: Stripe.Checkout.Session,
): Promise<{ cancelled: boolean; orderId: string | null }> {
  const order = await locateOrderForSession(session);
  if (!order) return { cancelled: false, orderId: null };
  const { cancelled } = await cancelPendingOrder(order.id);
  return { cancelled, orderId: order.id };
}

/**
 * Customer backed out of Stripe Checkout (cancel_url). Cancels the pending order and, when Stripe
 * is configured, expires the Checkout Session so the abandoned payment page cannot be completed later.
 */
export async function abandonCheckout(
  orderId: string,
): Promise<{ cancelled: boolean; sessionExpired: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, stripeSessionId: true },
  });
  if (!order) return { cancelled: false, sessionExpired: false };

  const { cancelled } = await cancelPendingOrder(order.id);
  if (!cancelled || !order.stripeSessionId || !isStripeConfigured) {
    return { cancelled, sessionExpired: false };
  }

  try {
    await stripe.checkout.sessions.expire(order.stripeSessionId);
    return { cancelled, sessionExpired: true };
  } catch (error) {
    // Already expired / completed - nothing to do. The webhook keeps the order consistent.
    console.info(
      `[orders] could not expire Checkout Session ${order.stripeSessionId}:`,
      error instanceof Error ? error.message : error,
    );
    return { cancelled, sessionExpired: false };
  }
}

/**
 * `payment_intent.payment_failed`: mark the payment FAILED unless the order is already settled.
 * The order stays PENDING because the customer may retry with another card inside the same
 * Checkout Session - a later success flips it to PAID.
 */
export async function markPaymentFailed(
  paymentIntentId: string,
  fallbackOrderId?: string | null,
): Promise<{ updated: boolean }> {
  const result = await prisma.order.updateMany({
    where: {
      OR: [
        { stripePaymentIntentId: paymentIntentId },
        ...(fallbackOrderId ? [{ id: fallbackOrderId }] : []),
      ],
      paymentStatus: "UNPAID",
    },
    data: { paymentStatus: "FAILED" },
  });
  return { updated: result.count > 0 };
}

/**
 * `checkout.session.async_payment_failed`: a delayed payment method (bank debit etc.) was declined.
 * The session is finished, so the order is cancelled as well as marked FAILED.
 */
export async function markCheckoutPaymentFailed(
  session: Stripe.Checkout.Session,
): Promise<{ updated: boolean; orderId: string | null }> {
  const order = await locateOrderForSession(session);
  if (!order) return { updated: false, orderId: null };

  const paymentIntentId = await resolvePaymentIntentId(
    order.id,
    paymentIntentIdOf(session.payment_intent),
  );
  const result = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: { in: ["UNPAID", "FAILED"] } },
    data: {
      paymentStatus: "FAILED",
      ...(order.status === "PENDING" ? { status: "CANCELLED" } : {}),
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    },
  });
  return { updated: result.count > 0, orderId: order.id };
}

/** `charge.refunded` (fully refunded): PAID -> REFUNDED. Order status is left for admins to manage. */
export async function markRefunded(
  paymentIntentId: string,
  fallbackOrderId?: string | null,
): Promise<{ updated: boolean }> {
  const result = await prisma.order.updateMany({
    where: {
      OR: [
        { stripePaymentIntentId: paymentIntentId },
        ...(fallbackOrderId ? [{ id: fallbackOrderId }] : []),
      ],
      paymentStatus: "PAID",
    },
    data: { paymentStatus: "REFUNDED" },
  });
  return { updated: result.count > 0 };
}
