import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { RatingDistribution, RatingSummary, ReviewData, ReviewRating } from "@/types/review";

/**
 * Shared Prisma select + serializers for reviews.
 * Server-only (imports the Prisma singleton) - never import from a Client Component.
 */

export const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  userId: true,
  productId: true,
  user: { select: { name: true, image: true } },
} satisfies Prisma.ReviewSelect;

export type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;

export function toReviewData(row: ReviewRow): ReviewData {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    author: { name: row.user.name, image: row.user.image },
    userId: row.userId,
    productId: row.productId,
  };
}

function isReviewRating(value: number): value is ReviewRating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function emptyRatingSummary(): RatingSummary {
  return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
}

/** Average rating, review count and per-star distribution for a product. */
export async function getProductRatingSummary(productId: string): Promise<RatingSummary> {
  const [aggregate, grouped] = await Promise.all([
    prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId },
      _count: { _all: true },
    }),
  ]);

  const distribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const group of grouped) {
    if (isReviewRating(group.rating)) distribution[group.rating] = group._count._all;
  }

  const count = aggregate._count._all;
  const average =
    count > 0 && aggregate._avg.rating !== null ? Math.round(aggregate._avg.rating * 10) / 10 : 0;

  return { average, count, distribution };
}
