import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { AdminCustomer } from "@/lib/admin/types";
import type { Pagination } from "@/types/product";

/** Query params accepted by /admin/customers. */
export const adminCustomerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().min(1).max(100).optional(),
  role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
});
export type AdminCustomerListQuery = z.infer<typeof adminCustomerListQuerySchema>;

/** Body accepted by the role-change Server Action. */
export const userRoleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["ADMIN", "CUSTOMER"]),
});

export const adminCustomerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  image: true,
  passwordHash: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export type AdminCustomerRow = Prisma.UserGetPayload<{ select: typeof adminCustomerSelect }>;

export function toAdminCustomer(row: AdminCustomerRow): AdminCustomer {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    image: row.image,
    ordersCount: row._count.orders,
    hasPassword: row.passwordHash !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getAdminCustomers(
  query: AdminCustomerListQuery,
): Promise<{ customers: AdminCustomer[]; pagination: Pagination }> {
  const where: Prisma.UserWhereInput = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: adminCustomerSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    customers: rows.map(toAdminCustomer),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
