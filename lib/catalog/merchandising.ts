import type { ProductRating } from "@/types/product";

/**
 * Pure merchandising rules for the home page. No Prisma: the loader in lib/catalog/home.ts feeds
 * these functions rows it has already fetched, and the tests feed them fixtures.
 */

export type MerchBadge = {
  label: "Best Seller" | "Trending" | "New";
  tone: "red" | "green" | "blue";
};

export const BEST_SELLER_BADGE: MerchBadge = { label: "Best Seller", tone: "red" };
export const TRENDING_BADGE: MerchBadge = { label: "Trending", tone: "green" };
export const NEW_BADGE: MerchBadge = { label: "New", tone: "blue" };

/** Products are "new" for this long after they are added. */
export const NEW_ARRIVAL_DAYS = 14;

type Ranked = { id: string; rating: ProductRating; createdAt: Date | string };

const time = (value: Date | string): number => new Date(value).getTime();

/**
 * Order featured products for the "Best Sellers" strip: most reviewed first, then best rated,
 * then newest. Review volume is the closest thing to sales data the store records.
 */
export function rankBestSellers<T extends Ranked>(products: readonly T[]): T[] {
  return [...products].sort(
    (a, b) =>
      b.rating.count - a.rating.count ||
      b.rating.average - a.rating.average ||
      time(b.createdAt) - time(a.createdAt),
  );
}

/**
 * Ribbons for the Best Sellers strip: the top-ranked product is the "Best Seller"; the newest of
 * the remaining products is "Trending". Everything else is unbadged.
 */
export function bestSellerBadges<T extends Ranked>(ranked: readonly T[]): Map<string, MerchBadge> {
  const badges = new Map<string, MerchBadge>();
  const [first, ...rest] = ranked;
  if (!first) return badges;

  badges.set(first.id, BEST_SELLER_BADGE);

  const newest = rest.reduce<T | null>(
    (best, item) => (best === null || time(item.createdAt) > time(best.createdAt) ? item : best),
    null,
  );
  if (newest) badges.set(newest.id, TRENDING_BADGE);

  return badges;
}

/** "New" ribbons for products added within `NEW_ARRIVAL_DAYS` of `now`. */
export function newArrivalBadges(
  products: readonly { id: string; createdAt: Date | string }[],
  now: Date = new Date(),
): Map<string, MerchBadge> {
  const cutoff = now.getTime() - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
  const badges = new Map<string, MerchBadge>();
  for (const product of products) {
    if (time(product.createdAt) >= cutoff) badges.set(product.id, NEW_BADGE);
  }
  return badges;
}
