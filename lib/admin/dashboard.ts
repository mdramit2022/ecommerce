import type { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminOrderListSelect, toAdminOrderRow } from "@/lib/admin/orders";
import type { DashboardStats } from "@/lib/admin/types";

export const LOW_STOCK_THRESHOLD = 5;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    revenue,
    ordersByStatus,
    ordersTotal,
    productsActive,
    productsTotal,
    customers,
    admins,
    lowStockRows,
    recentRows,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.product.findMany({
      where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      select: { id: true, title: true, slug: true, stock: true, images: true },
      orderBy: [{ stock: "asc" }, { title: "asc" }],
      take: 10,
    }),
    prisma.order.findMany({
      select: adminOrderListSelect,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const byStatus: Record<OrderStatus, number> = {
    PENDING: 0,
    PAID: 0,
    SHIPPED: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  for (const group of ordersByStatus) {
    byStatus[group.status] = group._count._all;
  }

  return {
    revenue: revenue._sum.total?.toNumber() ?? 0,
    ordersTotal,
    ordersByStatus: byStatus,
    productsActive,
    productsTotal,
    customers,
    admins,
    lowStock: lowStockRows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      stock: row.stock,
      image: row.images[0] ?? null,
    })),
    recentOrders: recentRows.map(toAdminOrderRow),
  };
}
