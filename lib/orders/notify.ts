import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { orderConfirmationEmail } from "@/lib/orders/emails";
import { orderDetailSelect, toOrderDetail } from "@/lib/orders/serialize";
import type { OrderDetail } from "@/types/order";

/**
 * Order notifications shared by the Stripe fulfilment path (`lib/orders/fulfill.ts`) and the
 * manual placement path (`lib/orders/place.ts`). Server only.
 */

/** Email written by POST /api/checkout before Stripe reports the real address. */
export const PENDING_EMAIL_PLACEHOLDER = "pending@checkout";

export async function loadOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const row = await prisma.order.findUnique({ where: { id: orderId }, select: orderDetailSelect });
  return row ? toOrderDetail(row) : null;
}

/** Best-effort confirmation email. Never throws - placing an order must not depend on email. */
export async function sendOrderConfirmation(order: OrderDetail): Promise<boolean> {
  if (!order.email || order.email === PENDING_EMAIL_PLACEHOLDER) {
    console.warn(`[orders] ${order.orderNumber}: no customer email on file, skipping confirmation`);
    return false;
  }
  try {
    const content = orderConfirmationEmail(order);
    const result = await sendEmail({ to: order.email, ...content });
    if (!result.sent) {
      console.info(`[orders] ${order.orderNumber}: confirmation email not sent (${result.reason})`);
    }
    return result.sent;
  } catch (error) {
    console.error(`[orders] ${order.orderNumber}: confirmation email failed`, error);
    return false;
  }
}
