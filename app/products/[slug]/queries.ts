import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getProductRatings } from "@/lib/reviews/ratings";
import { attachRatings } from "@/lib/reviews/format";
import {
  productCardSelect,
  productDetailSelect,
  toProductCardData,
  toProductDetailData,
} from "@/lib/serializers";
import type { ProductCardData, ProductDetailData } from "@/types/product";

/** Data access for the product detail route. Server-only. */

/**
 * Active product by slug. Memoised per request with React `cache` so `generateMetadata`
 * and the page component share a single query.
 */
export const getProductBySlug = cache(async (slug: string): Promise<ProductDetailData | null> => {
  const row = await prisma.product.findUnique({ where: { slug }, select: productDetailSelect });
  if (!row || !row.isActive) return null;
  return toProductDetailData(row);
});

/** Up to `take` other active products from the same category, featured first. */
export async function getRelatedProducts(
  categoryId: string,
  excludeProductId: string,
  take = 4,
): Promise<ProductCardData[]> {
  const rows = await prisma.product.findMany({
    where: { categoryId, isActive: true, id: { not: excludeProductId } },
    select: productCardSelect,
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
  });
  const products = rows.map(toProductCardData);
  const ratings = await getProductRatings(products.map((product) => product.id));
  return attachRatings(products, ratings);
}
