import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type { OrderDetail } from "@/types/order";
import { formatDateTime } from "@/lib/account/format";
import { getPaymentMethod } from "@/lib/payments/methods";

export type TimelineStepState = "done" | "current" | "upcoming" | "cancelled";

export type TimelineStep = {
  key: string;
  label: string;
  description: string;
  state: TimelineStepState;
};

const paymentDescription: Record<PaymentStatus, string> = {
  UNPAID: "Waiting for payment to be confirmed.",
  PAID: "Payment received.",
  FAILED: "Payment failed. Please try again from your cart.",
  REFUNDED: "Payment was refunded.",
};

/** What the customer is waiting for while a manually settled payment is still unconfirmed. */
function unpaidDescription(order: OrderDetail): string {
  const method = getPaymentMethod(order.paymentMethod);
  if (!method.manual) return paymentDescription.UNPAID;
  if (order.paymentMethod === "CASH_ON_DELIVERY") {
    return "Payable in cash when your order is delivered.";
  }
  return `We are verifying your ${method.label} payment.`;
}

/** Happy-path progression after an order is placed (see lib/orders/status.ts). */
const flow: readonly OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];

/**
 * Derives a human-readable progress timeline from an order's status + payment status.
 * PENDING -> PAID -> SHIPPED -> DELIVERED, or a short cancelled branch.
 */
export function buildOrderTimeline(order: OrderDetail): TimelineStep[] {
  const placed: TimelineStep = {
    key: "placed",
    label: "Order placed",
    description: `Placed on ${formatDateTime(order.createdAt)}`,
    state: "done",
  };

  if (order.status === "CANCELLED") {
    let description = "This order was cancelled before payment was completed.";
    if (order.paymentStatus === "REFUNDED") description = "Your payment has been refunded.";
    else if (order.paymentStatus === "PAID") description = "A refund is being processed.";

    return [
      placed,
      { key: "cancelled", label: "Order cancelled", description, state: "cancelled" },
    ];
  }

  const reachedIndex = flow.indexOf(order.status); // -1 while PENDING
  const stateFor = (index: number): TimelineStepState => {
    if (index <= reachedIndex) return "done";
    if (index === reachedIndex + 1) return "current";
    return "upcoming";
  };

  // Manual methods (cash on delivery, wallets, bank transfer) settle independently of the order
  // status, so the payment step follows paymentStatus rather than the shipping progress.
  const manualPayment = getPaymentMethod(order.paymentMethod).manual;
  const paidState: TimelineStepState =
    order.paymentStatus === "PAID" || order.paymentStatus === "REFUNDED"
      ? "done"
      : order.paymentStatus === "FAILED"
        ? "cancelled"
        : manualPayment
          ? "current"
          : stateFor(0);

  const shippedState = stateFor(1);
  const deliveredState = stateFor(2);

  return [
    placed,
    {
      key: "paid",
      label:
        manualPayment && order.paymentMethod === "CASH_ON_DELIVERY"
          ? "Payment"
          : "Payment confirmed",
      description:
        order.paymentStatus === "UNPAID"
          ? unpaidDescription(order)
          : paymentDescription[order.paymentStatus],
      state: paidState,
    },
    {
      key: "shipped",
      label: "Shipped",
      description:
        shippedState === "done"
          ? "Your order is on its way."
          : "We will let you know when your order ships.",
      state: shippedState,
    },
    {
      key: "delivered",
      label: "Delivered",
      description:
        deliveredState === "done"
          ? `Delivered. Last updated ${formatDateTime(order.updatedAt)}.`
          : "Estimated after shipping.",
      state: deliveredState,
    },
  ];
}
