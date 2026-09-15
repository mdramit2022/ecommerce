import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  orderDetailSelect,
  orderSummarySelect,
  toOrderDetail,
  toOrderSummary,
} from "@/lib/orders/serialize";
import type { OrderListQuery } from "@/lib/validations/order";
import type { OrderDetail, OrderSummary } from "@/types/order";
import type { PaginatedResponse } from "@/types/product";

export async function listUserOrders(
  userId: string,
  { page, limit }: OrderListQuery,
): Promise<PaginatedResponse<OrderSummary>> {
  const where: Prisma.OrderWhereInput = { userId };
  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: orderSummarySelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: rows.map(toOrderSummary),
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function listRecentUserOrders(userId: string, take = 3): Promise<OrderSummary[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    select: orderSummarySelect,
    orderBy: { createdAt: "desc" },
    take,
  });
  return rows.map(toOrderSummary);
}

export function countUserOrders(userId: string): Promise<number> {
  return prisma.order.count({ where: { userId } });
}

/**
 * Loads one order. Pass `userId` to restrict to the owner (customer view);
 * pass `null` to skip the ownership filter (admin view).
 */
export async function getOrderDetail(
  id: string,
  userId: string | null,
): Promise<OrderDetail | null> {
  const row = await prisma.order.findFirst({
    where: userId === null ? { id } : { id, userId },
    select: orderDetailSelect,
  });
  return row ? toOrderDetail(row) : null;
}
