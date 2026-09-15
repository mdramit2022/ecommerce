import type { Metadata } from "next";
import { listNavCategories } from "@/lib/catalog/categories";
import { getHomeData } from "@/lib/catalog/home";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { CategorySidebar } from "@/components/home/CategorySidebar";
import { HappyCustomers } from "@/components/home/HappyCustomers";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductStrip } from "@/components/home/ProductStrip";
import { PromoBanners } from "@/components/home/PromoBanners";
import { SectionHeading } from "@/components/home/SectionHeading";
import { StoreInfo } from "@/components/home/StoreInfo";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import { TrustBadges } from "@/components/home/TrustBadges";
import { Alert } from "@/components/ui/Alert";
import { FlameIcon, SparklesIcon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Kitchenware & Household Products in Nepal",
  description:
    "Pressure cookers, cookware, stainless steel, plastic and household essentials with cash on delivery across Nepal.",
};

// Live catalog data (stock, ratings) and the admin-redirect notice in the query string.
export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Server Component: the storefront landing page. Category panel + hero, category circles,
 * best sellers, collection tiles, new arrivals, trust badges, social proof and store details.
 * The searchable catalog lives at /shop.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, categories, home] = await Promise.all([
    searchParams,
    listNavCategories(),
    getHomeData(),
  ]);
  const forbidden = params.error === "forbidden";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      {forbidden && (
        <Alert tone="warning" className="mb-4">
          You do not have permission to access the admin area.
        </Alert>
      )}

      {/* Desktop: the open category panel spans the hero and the category row beside it. */}
      <div className="flex items-start gap-4">
        <CategorySidebar categories={categories} />
        <div className="min-w-0 flex-1">
          <HeroCarousel />
          <div className="mt-6 lg:mt-7">
            <CategoryCircles categories={categories} />
          </div>
        </div>
      </div>

      {home.bestSellers.length > 0 && (
        <section aria-labelledby="best-sellers" className="mt-10">
          <SectionHeading
            id="best-sellers"
            icon={<FlameIcon className="h-6 w-6" />}
            title="Best Sellers"
            subtitle="Our most popular products"
            viewAll={{ href: "/shop?featured=true" }}
          />
          <ProductStrip products={home.bestSellers} priority />
        </section>
      )}

      <div className="mt-10">
        <PromoBanners />
      </div>

      {home.newArrivals.length > 0 && (
        <section aria-labelledby="new-arrivals" className="mt-10">
          <SectionHeading
            id="new-arrivals"
            icon={<SparklesIcon className="h-6 w-6" />}
            title="New Arrivals"
            viewAll={{ href: "/shop?sort=newest" }}
          />
          <ProductStrip products={home.newArrivals} variant="compact" />
        </section>
      )}

      <div className="mt-10">
        <TrustBadges />
      </div>

      <section
        aria-label="Customers and store"
        className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.85fr_1.35fr]"
      >
        <TestimonialCarousel />
        <HappyCustomers reviews={home.reviews} />
        <StoreInfo />
      </section>
    </main>
  );
}
