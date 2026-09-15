import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * /sitemap.xml
 *
 * Rendered on every request so newly published products appear immediately and so the build
 * never needs a database (CI builds with a placeholder DATABASE_URL). If the database is
 * unreachable we still serve the static entries instead of a 500.
 */
export const dynamic = "force-dynamic";

const STATIC_ENTRIES: ReadonlyArray<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
];

function staticEntries(now: Date): MetadataRoute.Sitemap {
  return STATIC_ENTRIES.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = staticEntries(new Date());

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        where: { products: { some: { isActive: true } } },
        select: { slug: true, updatedAt: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    for (const category of categories) {
      entries.push({
        // Next writes <loc> verbatim, so the slug must be URL-encoded (no raw "&" or "<").
        url: absoluteUrl(`/shop?category=${encodeURIComponent(category.slug)}`),
        lastModified: category.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const product of products) {
      entries.push({
        url: absoluteUrl(`/products/${encodeURIComponent(product.slug)}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    // No stack trace to the client; the static entries are still valid.
    console.error(
      "[sitemap] Database unavailable, serving static entries only:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return entries;
}
