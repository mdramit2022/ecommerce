import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  orderDetailSelect,
  orderSummarySelect,
  toOrderDetail,
  toOrderSummary,
} from "@/lib/orders/serialize";
import { canTransitionOrder, canTransitionPayment, hasReservedStock } from "@/lib/orders/status";
import { getPaymentMethod, isManualPaymentMethod } from "@/lib/payments/methods";
import type {
  AdminOrderListQuery,
  OrderPaymentUpdateInput,
  OrderStatusUpdateInput,
} from "@/lib/validations/order";
import type { AdminOrderRow } from "@/lib/admin/types";
import type { OrderDetail } from "@/types/order";
import type { Pagination } from "@/types/product";

/** Restore the stock an order had reserved. Used when a reserved order is cancelled. */
async function restoreStock(
  tx: Prisma.TransactionClient,
  items: readonly { productId: string; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** Order list row for admin tables: summary + customer email/name. */
export const adminOrderListSelect = {
  ...orderSummarySelect,
  email: true,
  user: { select: { name: true } },
} satisfies Prisma.OrderSelect;

export type AdminOrderListRow = Prisma.OrderGetPayload<{ select: typeof adminOrderListSelect }>;

export function toAdminOrderRow(row: AdminOrderListRow): AdminOrderRow {
  return { ...toOrderSummary(row), email: row.email, customerName: row.user?.name ?? null };
}

export function buildAdminOrderWhere(query: AdminOrderListQuery): Prisma.OrderWhereInput {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.paymentMethod ? { paymentMethod: query.paymentMethod } : {}),
    ...(query.q
      ? {
          OR: [
            { orderNumber: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { shippingName: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function getAdminOrders(
  query: AdminOrderListQuery,
): Promise<{ orders: AdminOrderRow[]; pagination: Pagination }> {
  const where = buildAdminOrderWhere(query);
  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: adminOrderListSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: rows.map(toAdminOrderRow),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getAdminOrderDetail(id: string): Promise<OrderDetail | null> {
  const row = await prisma.order.findUnique({ where: { id }, select: orderDetailSelect });
  return row ? toOrderDetail(row) : null;
}

export type TransitionOrderResult =
  | { ok: true; order: OrderDetail; message: string }
  | { ok: false; status: 404 | 409; error: string };

/**
 * Apply an admin status change, enforcing the transition graph in lib/orders/status.ts.
 *
 * - The allowed transitions depend on the payment method: a cash-on-delivery order may ship before
 *   it is paid, and may be cancelled after shipping (a refused delivery).
 * - PENDING -> PAID (manual confirmation) also sets paymentStatus PAID when it was UNPAID.
 * - Cancelling a PAID order sets paymentStatus REFUNDED only when `markRefunded` is true.
 *   No Stripe refund is issued here - do that in the Stripe dashboard (or a follow-up integration).
 * - Cancelling an order that had reserved stock puts that stock back on the shelf.
 * - Uses a conditional `updateMany` so two admins cannot race past the same transition.
 */
export async function transitionOrderStatus(
  orderId: string,
  input: OrderStatusUpdateInput,
): Promise<TransitionOrderResult> {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      items: { select: { productId: true, quantity: true } },
    },
  });
  if (!current) return { ok: false, status: 404, error: "Order not found" };

  if (!canTransitionOrder(current.status, input.status, current.paymentMethod)) {
    return {
      ok: false,
      status: 409,
      error: `Cannot change status from ${current.status} to ${input.status}`,
    };
  }

  const data: Prisma.OrderUpdateManyMutationInput = { status: input.status };
  const notes: string[] = [`Order marked as ${input.status}.`];

  if (input.status === "PAID" && current.paymentStatus === "UNPAID") {
    data.paymentStatus = "PAID";
    notes.push("Payment status set to PAID.");
  }
  if (input.status === "CANCELLED" && input.markRefunded && current.paymentStatus === "PAID") {
    data.paymentStatus = "REFUNDED";
    notes.push("Payment status set to REFUNDED (no Stripe refund was issued).");
  }

  const restock = input.status === "CANCELLED" && hasReservedStock(current);

  const updatedCount = await prisma.$transaction(async (tx) => {
    const result = await tx.order.updateMany({
      where: { id: orderId, status: current.status },
      data,
    });
    if (result.count === 0) return 0;
    if (restock) await restoreStock(tx, current.items);
    return result.count;
  });

  if (updatedCount === 0) {
    return {
      ok: false,
      status: 409,
      error: "The order was modified by someone else. Reload and try again.",
    };
  }
  if (restock) notes.push("Reserved stock was returned to inventory.");

  const row = await prisma.order.findUnique({ where: { id: orderId }, select: orderDetailSelect });
  if (!row) return { ok: false, status: 404, error: "Order not found" };

  return { ok: true, order: toOrderDetail(row), message: notes.join(" ") };
}

/**
 * Record the outcome of a manually settled payment (cash on delivery, eSewa, IME Pay, bank
 * transfer). Card payments are settled by Stripe and its webhook, so they are refused here.
 *
 * Marking a PENDING order PAID also moves its status to PAID, which is what "the money arrived"
 * means for an order that has not shipped yet. A cash-on-delivery order that already shipped keeps
 * its status; only the payment is recorded.
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  input: OrderPaymentUpdateInput,
): Promise<TransitionOrderResult> {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, paymentStatus: true, paymentMethod: true },
  });
  if (!current) return { ok: false, status: 404, error: "Order not found" };

  if (!isManualPaymentMethod(current.paymentMethod)) {
    return {
      ok: false,
      status: 409,
      error:
        "Card payments are settled by Stripe. Refund or adjust this order in the Stripe dashboard.",
    };
  }

  if (!canTransitionPayment(current.paymentStatus, input.paymentStatus)) {
    return {
      ok: false,
      status: 409,
      error: `Cannot change payment from ${current.paymentStatus} to ${input.paymentStatus}`,
    };
  }

  const method = getPaymentMethod(current.paymentMethod);
  const data: Prisma.OrderUpdateManyMutationInput = { paymentStatus: input.paymentStatus };
  const notes: string[] = [`${method.label} payment marked as ${input.paymentStatus}.`];

  if (input.paymentReference !== undefined) {
    data.paymentReference = input.paymentReference;
    notes.push(input.paymentReference ? "Reference saved." : "Reference cleared.");
  }

  // Money in on an order that has not shipped yet also confirms the order itself.
  if (
    input.paymentStatus === "PAID" &&
    current.status === "PENDING" &&
    canTransitionOrder("PENDING", "PAID", current.paymentMethod)
  ) {
    data.status = "PAID";
    notes.push("Order status set to PAID.");
  }

  const updated = await prisma.order.updateMany({
    where: { id: orderId, paymentStatus: current.paymentStatus },
    data,
  });
  if (updated.count === 0) {
    return {
      ok: false,
      status: 409,
      error: "The order was modified by someone else. Reload and try again.",
    };
  }

  const row = await prisma.order.findUnique({ where: { id: orderId }, select: orderDetailSelect });
  if (!row) return { ok: false, status: 404, error: "Order not found" };

  return { ok: true, order: toOrderDetail(row), message: notes.join(" ") };
}
