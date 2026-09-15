import { prisma } from "@/lib/prisma";
import {
  bestSellerBadges,
  newArrivalBadges,
  rankBestSellers,
  type MerchBadge,
} from "@/lib/catalog/merchandising";
import { getProductRatings } from "@/lib/reviews/ratings";
import { attachRatings, toProductRating } from "@/lib/reviews/format";
import { productCardSelect, toProductCardData } from "@/lib/serializers";
import type { ProductCardData, ProductRating } from "@/types/product";

/** Data for the storefront home page. Server only. */

export const HOME_STRIP_SIZE = 5;

export type HomeProduct = ProductCardData & { rating: ProductRating; badge: MerchBadge | null };

export type HomeData = {
  bestSellers: HomeProduct[];
  newArrivals: HomeProduct[];
  /** Store-wide review figures for the "happy customers" card. */
  reviews: ProductRating;
};

const stripSelect = { ...productCardSelect, createdAt: true };

export async function getHomeData(now: Date = new Date()): Promise<HomeData> {
  const [featuredRows, newestRows, aggregate] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      select: stripSelect,
      orderBy: { createdAt: "desc" },
      take: HOME_STRIP_SIZE * 2, // ranked by reviews below, then trimmed
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: stripSelect,
      orderBy: { createdAt: "desc" },
      take: HOME_STRIP_SIZE,
    }),
    prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
  ]);

  const ids = [...new Set([...featuredRows, ...newestRows].map((row) => row.id))];
  const ratings = await getProductRatings(ids);

  const withMeta = (rows: typeof featuredRows) =>
    attachRatings(
      rows.map((row) => ({ ...toProductCardData(row), createdAt: row.createdAt })),
      ratings,
    );

  const ranked = rankBestSellers(withMeta(featuredRows)).slice(0, HOME_STRIP_SIZE);
  const bestBadges = bestSellerBadges(ranked);

  const newest = withMeta(newestRows);
  const newBadges = newArrivalBadges(newest, now);

  const strip = (items: typeof ranked, badges: Map<string, MerchBadge>): HomeProduct[] =>
    items.map(({ createdAt: _createdAt, ...product }) => ({
      ...product,
      badge: badges.get(product.id) ?? null,
    }));

  return {
    bestSellers: strip(ranked, bestBadges),
    newArrivals: strip(newest, newBadges),
    reviews: toProductRating(aggregate._avg.rating, aggregate._count._all),
  };
}
