import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { listNavCategories } from "@/lib/catalog/categories";
import { firstValues, type RawSearchParams } from "@/lib/admin/search-params";
import { getProductRatings } from "@/lib/reviews/ratings";
import { attachRatings } from "@/lib/reviews/format";
import { productCardSelect, toProductCardData } from "@/lib/serializers";
import { productListQuerySchema } from "@/lib/validations/product";
import { cn } from "@/lib/utils";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/product/ProductCard";
import { SortSelect } from "@/components/shop/SortSelect";
import { EmptyState, PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse every product: cookware, stainless steel, plastic, appliances and more.",
};

// Depends on query params and live stock; render on request.
export const dynamic = "force-dynamic";

const SHOP_PATH = "/shop";

type ShopPageProps = { searchParams: Promise<RawSearchParams> };

const sortMap = {
  newest: { createdAt: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  title: { title: "asc" },
} satisfies Record<string, Prisma.ProductOrderByWithRelationInput>;

/**
 * Server Component: the searchable, filterable catalog (formerly the home page).
 * Fetches directly via Prisma (no HTTP round-trip to our own API).
 */
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const raw = firstValues(await searchParams);
  const parsed = productListQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : productListQuerySchema.parse({});
  const { page, limit, category, q, sort, featured, onSale } = query;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(category ? { category: { slug: category } } : {}),
    ...(featured ? { isFeatured: true } : {}),
    ...(onSale ? { compareAtPrice: { gt: prisma.product.fields.price } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: sortMap[sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    listNavCategories(),
  ]);

  const ratings = await getProductRatings(rows.map((row) => row.id));
  const products = attachRatings(rows.map(toProductCardData), ratings);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const preserve = {
    q,
    sort: sort === "newest" ? undefined : sort,
    featured: featured ? "true" : undefined,
    onSale: onSale ? "true" : undefined,
  };
  const activeCategory = categories.find((c) => c.slug === category);

  const toggleHref = (key: "featured" | "onSale", enabled: boolean) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...preserve, category })) {
      if (v) params.set(k, v);
    }
    if (enabled) params.delete(key);
    else params.set(key, "true");
    const qs = params.toString();
    return qs ? `${SHOP_PATH}?${qs}` : SHOP_PATH;
  };

  const toggleChip = (label: string, key: "featured" | "onSale", enabled: boolean) => (
    <Link
      href={toggleHref(key, enabled)}
      aria-pressed={enabled}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-sm transition",
        enabled
          ? "border-brand-orange bg-brand-orange text-white"
          : "hover:border-brand-orange hover:text-brand-orange border-neutral-300 bg-white text-neutral-700",
      )}
    >
      {label}
    </Link>
  );

  const title = activeCategory?.name ?? (featured ? "Best Sellers" : onSale ? "Offers" : "Shop");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={title}
        description={`${total} ${total === 1 ? "product" : "products"}${q ? ` matching "${q}"` : ""}`}
        actions={
          <Suspense fallback={<div className="h-9 w-56 rounded-lg bg-neutral-100" />}>
            <SortSelect value={sort} />
          </Suspense>
        }
      />

      <div className="mb-6 flex flex-col gap-3">
        <CategoryFilter
          categories={categories.map((c) => ({
            name: c.name,
            slug: c.slug,
            productCount: c.productCount,
          }))}
          activeSlug={category}
          preserve={preserve}
        />
        <div className="flex flex-wrap gap-2">
          {toggleChip("Best Sellers", "featured", featured)}
          {toggleChip("On Sale", "onSale", onSale)}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try another category, clear the search, or browse everything."
          action={
            <Link
              href={SHOP_PATH}
              className="bg-brand-blue hover:bg-brand-blue-dark inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
            >
              Browse all products
            </Link>
          }
        />
      ) : (
        <section
          aria-label="Products"
          className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </section>
      )}

      <div className="mt-10">
        <Pagination page={page} totalPages={totalPages} preserve={{ ...preserve, category }} />
      </div>
    </main>
  );
}
