import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdminCategory, PublicCategory } from "@/lib/admin/types";

/** Public shape: counts only active products. */
export const publicCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  _count: { select: { products: { where: { isActive: true } } } },
} satisfies Prisma.CategorySelect;

/** Admin shape: counts every product (the FK is Restrict, so any product blocks deletion). */
export const adminCategorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { products: true } },
} satisfies Prisma.CategorySelect;

export type PublicCategoryRow = Prisma.CategoryGetPayload<{ select: typeof publicCategorySelect }>;
export type AdminCategoryRow = Prisma.CategoryGetPayload<{ select: typeof adminCategorySelect }>;

export function toPublicCategory(row: PublicCategoryRow): PublicCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    productCount: row._count.products,
  };
}

export function toAdminCategory(row: AdminCategoryRow): AdminCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    productCount: row._count.products,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  const rows = await prisma.category.findMany({
    select: publicCategorySelect,
    orderBy: { name: "asc" },
  });
  return rows.map(toPublicCategory);
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const rows = await prisma.category.findMany({
    select: adminCategorySelect,
    orderBy: { name: "asc" },
  });
  return rows.map(toAdminCategory);
}

export async function getAdminCategory(id: string): Promise<AdminCategory | null> {
  const row = await prisma.category.findUnique({ where: { id }, select: adminCategorySelect });
  return row ? toAdminCategory(row) : null;
}
