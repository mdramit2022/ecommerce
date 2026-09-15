import type { Prisma } from "@prisma/client";
import type { ProductCardData, ProductDetailData } from "@/types/product";

/**
 * Prisma `Decimal` and `Date` are not serialisable across the Server -> Client boundary.
 * Convert here, once, so components receive plain JSON-compatible data.
 */

export const productCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  images: true,
  category: { select: { name: true, slug: true } },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export function toProductCardData(row: ProductCardRow): ProductCardData {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    price: row.price.toNumber(),
    compareAtPrice: row.compareAtPrice?.toNumber() ?? null,
    stock: row.stock,
    image: row.images[0] ?? null,
    // Explicit so a wider row (e.g. `productDetailSelect`) never leaks extra category fields.
    category: { name: row.category.name, slug: row.category.slug },
  };
}

/**
 * Full product row shared by the storefront detail page (`app/products/[slug]`),
 * GET /api/products/[id] and the admin product screens. Superset of `productCardSelect`.
 */
export const productDetailSelect = {
  ...productCardSelect,
  description: true,
  isActive: true,
  isFeatured: true,
  categoryId: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductSelect;

export type ProductDetailRow = Prisma.ProductGetPayload<{ select: typeof productDetailSelect }>;

/** Storefront detail shape. Callers filter out inactive products themselves (404). */
export function toProductDetailData(row: ProductDetailRow): ProductDetailData {
  return {
    ...toProductCardData(row),
    description: row.description,
    images: row.images,
    categoryId: row.categoryId,
    isFeatured: row.isFeatured,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
