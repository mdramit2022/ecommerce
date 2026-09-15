import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { pluralizeReviews } from "@/lib/reviews/format";
import { getProductRatingSummary, reviewSelect, toReviewData } from "@/lib/reviews/serialize";
import { productJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/Badge";
import { AddToCartPanel } from "@/components/product/AddToCartPanel";
import { ImageGallery } from "@/components/product/ImageGallery";
import { StockStatus } from "@/components/product/StockStatus";
import { RatingSummary } from "@/components/reviews/RatingSummary";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { Stars } from "@/components/reviews/Stars";
import type { ProductCardData } from "@/types/product";
import { getProductBySlug, getRelatedProducts } from "./queries";

// Depends on the viewer's session (own review, canReview) - always render on request.
export const dynamic = "force-dynamic";

const REVIEWS_PAGE_SIZE = 10;
const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function truncate(text: string, max: number): string {
  const normalised = text.replace(/\s+/g, " ").trim();
  if (normalised.length <= max) return normalised;
  return `${normalised.slice(0, max - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const description = truncate(product.description, 160);
  const url = `${appUrl}/products/${product.slug}`;

  return {
    metadataBase: new URL(appUrl),
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description,
      url,
      images: product.image ? [{ url: product.image, alt: product.title }] : [],
    },
  };
}

/**
 * Server Component: product detail page.
 * Loads the product by slug (404 when missing or inactive), related products and reviews via Prisma.
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const [summary, reviewRows, related, ownReviewRow] = await Promise.all([
    getProductRatingSummary(product.id),
    prisma.review.findMany({
      where: { productId: product.id },
      select: reviewSelect,
      orderBy: { createdAt: "desc" },
      take: REVIEWS_PAGE_SIZE,
    }),
    getRelatedProducts(product.categoryId, product.id),
    userId
      ? prisma.review.findUnique({
          where: { userId_productId: { userId, productId: product.id } },
          select: reviewSelect,
        })
      : Promise.resolve(null),
  ]);

  const reviews = reviewRows.map(toReviewData);
  const ownReview = ownReviewRow ? toReviewData(ownReviewRow) : null;
  const canReview = userId !== null && ownReview === null;

  const onSale = product.compareAtPrice !== null && product.compareAtPrice > product.price;
  const percentOff =
    onSale && product.compareAtPrice !== null && product.compareAtPrice > 0
      ? Math.round((1 - product.price / product.compareAtPrice) * 100)
      : 0;

  // Only the fields the cart store needs cross to the client.
  const cardData: ProductCardData = {
    id: product.id,
    title: product.title,
    slug: product.slug,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    image: product.image,
    category: product.category,
  };

  // JSON-LD has to be emitted as the raw text body of a <script>; React would HTML-escape it if
  // passed as children. dangerouslySetInnerHTML is used here ONLY for this structured-data block:
  // serializeJsonLd is JSON.stringify of server-side data with "<" escaped, so a stray "</script>"
  // inside the admin-authored description can never terminate the tag. Never used for user content
  // (CLAUDE.md 7).
  const jsonLdHtml = serializeJsonLd(
    productJsonLd({
      name: product.title,
      description: truncate(product.description, 5000),
      url: `${appUrl}/products/${product.slug}`,
      images: product.images,
      price: product.price,
      stock: product.stock,
      sku: product.id,
      category: product.category.name,
      rating: { value: summary.average, count: summary.count },
    }),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml }} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
          <li>
            <Link href="/" className="hover:text-neutral-900 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
              className="hover:text-neutral-900 hover:underline"
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-neutral-900">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ImageGallery images={product.images} title={product.title} />

        <section aria-labelledby="product-title" className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Link
              href={`/shop?category=${encodeURIComponent(product.category.slug)}`}
              className="w-fit text-xs tracking-wide text-neutral-500 uppercase hover:text-neutral-900 hover:underline"
            >
              {product.category.name}
            </Link>
            <h1
              id="product-title"
              className="text-3xl font-semibold tracking-tight text-neutral-900"
            >
              {product.title}
            </h1>
            <a
              href="#reviews"
              className="flex w-fit items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
            >
              <Stars rating={summary.average} size="sm" />
              {summary.count > 0 ? (
                <span>
                  {summary.average.toFixed(1)} · {pluralizeReviews(summary.count)}
                </span>
              ) : (
                <span>No reviews yet</span>
              )}
            </a>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-semibold tracking-tight text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {onSale && product.compareAtPrice !== null && (
              <>
                <span className="text-lg text-neutral-400">
                  <span className="sr-only">Was </span>
                  <s>{formatPrice(product.compareAtPrice)}</s>
                </span>
                {percentOff > 0 && <Badge tone="danger">{percentOff}% off</Badge>}
              </>
            )}
          </div>

          <div>
            <StockStatus stock={product.stock} />
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-line text-neutral-700">
            {product.description}
          </p>

          <AddToCartPanel product={cardData} className="mt-2" />
        </section>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2
            id="related-heading"
            className="mb-6 text-xl font-semibold tracking-tight text-neutral-900"
          >
            Related products
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-24">
        <h2
          id="reviews-heading"
          className="mb-6 text-xl font-semibold tracking-tight text-neutral-900"
        >
          Customer reviews
        </h2>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="flex flex-col gap-6">
            <RatingSummary summary={summary} />
            <ReviewForm
              productId={product.id}
              productSlug={product.slug}
              isSignedIn={userId !== null}
              canReview={canReview}
              existingReview={
                ownReview
                  ? { id: ownReview.id, rating: ownReview.rating, comment: ownReview.comment }
                  : null
              }
            />
          </div>
          <ReviewList
            productId={product.id}
            reviews={reviews}
            total={summary.count}
            pageSize={REVIEWS_PAGE_SIZE}
            currentUserId={userId}
          />
        </div>
      </section>
    </main>
  );
}
