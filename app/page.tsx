import type { Metadata } from "next";
import { listNavCategories } from "@/lib/catalog/categories";
import { getHomeData } from "@/lib/catalog/home";
import { getHomeContent, getSiteContent } from "@/lib/content/site";
import { CategoryCircles } from "@/components/home/CategoryCircles";
import { HappyCustomers } from "@/components/home/HappyCustomers";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductStrip } from "@/components/home/ProductStrip";
import { PromoBanners } from "@/components/home/PromoBanners";
import { SectionHeading } from "@/components/home/SectionHeading";
import { SideBanner } from "@/components/home/SideBanner";
import { StoreInfo } from "@/components/home/StoreInfo";
import { TestimonialCarousel } from "@/components/home/TestimonialCarousel";
import { TrustBadges } from "@/components/home/TrustBadges";
import { Alert } from "@/components/ui/Alert";
import { FlameIcon, SparklesIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Kitchenware & Household Products in Nepal",
  description:
    "Pressure cookers, cookware, stainless steel, plastic and household essentials with cash on delivery across Nepal.",
};

// Live catalog data (stock, ratings), admin-managed content and the admin-redirect notice.
export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Server Component: the storefront landing page. Every marketing element (hero slides, side
 * banner, promo tiles, trust badges, testimonials, store details) is admin-managed content;
 * the product strips come from the catalog. The searchable catalog lives at /shop.
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, categories, home, content, site] = await Promise.all([
    searchParams,
    listNavCategories(),
    getHomeData(),
    getHomeContent(),
    getSiteContent(),
  ]);
  const forbidden = params.error === "forbidden";
  const hasTestimonials = content.testimonials.length > 0;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      {forbidden && (
        <Alert tone="warning" className="mb-4">
          You do not have permission to access the admin area.
        </Alert>
      )}

      {/* Desktop: the side banner spans the hero and the category row beside it. */}
      <div className="flex items-stretch gap-4">
        {content.sideBanner && <SideBanner banner={content.sideBanner} />}
        <div className="min-w-0 flex-1">
          <HeroCarousel
            slides={content.heroSlides}
            yearsInBusiness={site.settings.yearsInBusiness}
          />
          <div className={cn(content.heroSlides.length > 0 && "mt-6 lg:mt-7")}>
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

      {content.promoTiles.length > 0 && (
        <div className="mt-10">
          <PromoBanners tiles={content.promoTiles} />
        </div>
      )}

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

      {site.trustBadges.length > 0 && (
        <div className="mt-10">
          <TrustBadges badges={site.trustBadges} />
        </div>
      )}

      <section
        aria-label="Customers and store"
        className={cn(
          "mt-6 grid gap-4",
          hasTestimonials ? "lg:grid-cols-[1fr_0.85fr_1.35fr]" : "lg:grid-cols-[0.85fr_1.35fr]",
        )}
      >
        {hasTestimonials && <TestimonialCarousel testimonials={content.testimonials} />}
        <HappyCustomers reviews={home.reviews} />
        <StoreInfo settings={site.settings} />
      </section>
    </main>
  );
}
