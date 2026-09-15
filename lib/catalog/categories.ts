import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Category data for the storefront shell (header menu, mobile drawer, home page circles).
 * Server only. Memoised per request with React `cache` so the layout and the page share one query.
 */

export type NavCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  /** Active products in the category. */
  productCount: number;
};

/**
 * Same list for the root layout, which must render even when the database is unreachable
 * (error pages, a cold start): failures are logged and the shell renders without categories.
 */
export async function listNavCategoriesSafe(): Promise<NavCategory[]> {
  try {
    return await listNavCategories();
  } catch (error) {
    console.error(
      "[layout] categories unavailable:",
      error instanceof Error ? error.message : String(error),
    );
    return [];
  }
}

/**
 * Categories that have something to sell, in the order they were created (the seed creates them
 * in menu order). Empty categories are left out - a menu entry with nothing behind it is a dead end.
 */
export const listNavCategories = cache(async (): Promise<NavCategory[]> => {
  const rows = await prisma.category.findMany({
    where: { products: { some: { isActive: true } } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    image: row.image,
    productCount: row._count.products,
  }));
});
