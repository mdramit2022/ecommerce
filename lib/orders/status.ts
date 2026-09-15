import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/**
 * The single source of truth for order and payment lifecycle transitions.
 *
 * Order status (prepaid methods - Stripe card payments):
 *
 *   PENDING -> PAID | CANCELLED
 *   PAID    -> SHIPPED | CANCELLED
 *   SHIPPED -> DELIVERED
 *
 * Cash on delivery inverts the money/goods order: the parcel ships before anything is collected,
 * and a customer may refuse it at the door. Those orders therefore also allow
 * PENDING -> SHIPPED and SHIPPED -> CANCELLED.
 *
 * Payment status:
 *
 *   UNPAID -> PAID | FAILED
 *   FAILED -> PAID | UNPAID   (the customer retries)
 *   PAID   -> REFUNDED
 */

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Cash on delivery: goods move before the money does. */
export const COD_ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const PAYMENT_STATUSES: readonly PaymentStatus[] = ["UNPAID", "PAID", "FAILED", "REFUNDED"];

/** Transition table for a given payment method. Only cash on delivery differs. */
export function orderStatusTransitions(
  method: PaymentMethod = "STRIPE",
): Record<OrderStatus, readonly OrderStatus[]> {
  return method === "CASH_ON_DELIVERY" ? COD_ORDER_STATUS_TRANSITIONS : ORDER_STATUS_TRANSITIONS;
}

export function canTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
  method: PaymentMethod = "STRIPE",
): boolean {
  return orderStatusTransitions(method)[from].includes(to);
}

export function nextOrderStatuses(
  from: OrderStatus,
  method: PaymentMethod = "STRIPE",
): readonly OrderStatus[] {
  return orderStatusTransitions(method)[from];
}

// ───────────────────────────── Payment status ─────────────────────────────

export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  UNPAID: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: ["PAID", "UNPAID"],
  REFUNDED: [],
};

export function canTransitionPayment(from: PaymentStatus, to: PaymentStatus): boolean {
  return PAYMENT_STATUS_TRANSITIONS[from].includes(to);
}

export function nextPaymentStatuses(from: PaymentStatus): readonly PaymentStatus[] {
  return PAYMENT_STATUS_TRANSITIONS[from];
}

/**
 * Whether stock has already been taken off the shelf for this order.
 *
 * Manual methods (cash on delivery, wallets, bank transfer) reserve stock the moment the order is
 * placed - the customer expects the goods to be held. Stripe orders only reserve on payment
 * (`lib/orders/fulfill.ts`), so an unpaid one never touched inventory. Cancelling an order that
 * reserved stock must put it back.
 */
export function hasReservedStock(order: {
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
}): boolean {
  if (order.paymentMethod !== "STRIPE") return true;
  return order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED";
}
