import { prisma } from "@/lib/prisma";
import { toProductRating } from "@/lib/reviews/format";
import type { ProductRating } from "@/types/product";

/**
 * Aggregate ratings for a set of products in one query - what product grids need next to each
 * card. Server only (Prisma). The per-product detail page keeps using `getProductRatingSummary`.
 */
export async function getProductRatings(
  productIds: readonly string[],
): Promise<Map<string, ProductRating>> {
  if (productIds.length === 0) return new Map();

  const groups = await prisma.review.groupBy({
    by: ["productId"],
    where: { productId: { in: [...productIds] } },
    _avg: { rating: true },
    _count: { _all: true },
  });

  return new Map(
    groups.map((group) => [group.productId, toProductRating(group._avg.rating, group._count._all)]),
  );
}
