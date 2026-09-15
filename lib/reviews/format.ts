import type { ProductRating } from "@/types/product";

/**
 * Client-safe formatting helpers for reviews (no Prisma imports).
 * A fixed locale + time zone keeps server and client output identical, avoiding hydration warnings.
 */

const reviewDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
});

/** "Sep 10, 2026" from an ISO string. */
export function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : reviewDateFormatter.format(date);
}

/** Display name for a reviewer, falling back to "Anonymous". */
export function reviewerDisplayName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : "Anonymous";
}

/** "1 review" / "12 reviews". */
export function pluralizeReviews(count: number): string {
  return `${count} ${count === 1 ? "review" : "reviews"}`;
}

/** Card-sized rating from an aggregate: mean rounded to 1 dp, 0 when there are no reviews. */
export function toProductRating(average: number | null | undefined, count: number): ProductRating {
  if (count <= 0 || average === null || average === undefined || !Number.isFinite(average)) {
    return { average: 0, count: Math.max(0, count) };
  }
  return { average: Math.round(average * 10) / 10, count };
}

/** Attach a rating to every product, defaulting to "unrated" when the map has no entry. */
export function attachRatings<T extends { id: string }>(
  products: readonly T[],
  ratings: ReadonlyMap<string, ProductRating>,
): Array<T & { rating: ProductRating }> {
  return products.map((product) => ({
    ...product,
    rating: ratings.get(product.id) ?? { average: 0, count: 0 },
  }));
}
