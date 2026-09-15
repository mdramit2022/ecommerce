import { SITE_NAME, absoluteUrl, getSiteUrl } from "@/lib/seo/site";
import { DEFAULT_CURRENCY } from "@/lib/utils";

/**
 * Typed JSON-LD (schema.org) builders. Each helper returns a plain object; render it with
 * `serializeJsonLd()` inside a `<script type="application/ld+json">` tag.
 *
 * Example (Server Component):
 *
 *   const jsonLd = productJsonLd({ ... });
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
 *   />
 *
 * `serializeJsonLd` escapes `<` so user-generated text (titles, descriptions) can never close the
 * script tag - this is the one sanctioned use of `dangerouslySetInnerHTML` in the codebase.
 */

const SCHEMA_CONTEXT = "https://schema.org" as const;

export type ProductAvailability = "InStock" | "OutOfStock" | "Discontinued";

export type ProductJsonLdInput = {
  name: string;
  description: string;
  /** Absolute or site-relative URL of the product page, e.g. `/products/classic-cotton-tee`. */
  url: string;
  /** Image URLs (absolute or site-relative). Empty / null omits the `image` property. */
  images?: readonly string[] | string | null;
  /** Unit price as a plain number (never a Prisma Decimal). */
  price: number;
  /** ISO 4217 code in any case; orders store "npr". Defaults to the store currency (NPR). */
  currency?: string;
  /** Units on hand; `<= 0` marks the offer OutOfStock. */
  stock: number;
  /** `false` marks the product Discontinued regardless of stock. */
  isActive?: boolean;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  /** Aggregate review rating (1-5). Omitted when `count` is 0. */
  rating?: { value: number; count: number } | null;
};

export type ProductJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "Product";
  name: string;
  description: string;
  url: string;
  image?: string[];
  sku?: string;
  category?: string;
  brand?: { "@type": "Brand"; name: string };
  offers: {
    "@type": "Offer";
    url: string;
    price: number;
    priceCurrency: string;
    availability: `https://schema.org/${ProductAvailability}`;
    itemCondition: "https://schema.org/NewCondition";
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    reviewCount: number;
    bestRating: 5;
    worstRating: 1;
  };
};

export type OrganizationJsonLdInput = {
  name?: string;
  /** Absolute or site-relative. Defaults to the site origin. */
  url?: string;
  /** Absolute or site-relative logo URL. */
  logo?: string | null;
  /** Social profile URLs. */
  sameAs?: readonly string[];
  /** Customer-service email address. */
  email?: string | null;
};

export type OrganizationJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "Organization";
  name: string;
  url: string;
  logo?: string;
  sameAs?: string[];
  contactPoint?: { "@type": "ContactPoint"; contactType: "customer service"; email: string };
};

export type BreadcrumbItem = { name: string; url: string };

export type BreadcrumbJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
};

export type WebsiteJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: { "@type": "EntryPoint"; urlTemplate: string };
    "query-input": "required name=search_term_string";
  };
};

export type JsonLd = ProductJsonLd | OrganizationJsonLd | BreadcrumbJsonLd | WebsiteJsonLd;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function toImageList(images: ProductJsonLdInput["images"]): string[] {
  if (!images) return [];
  const list = typeof images === "string" ? [images] : images;
  return list.filter((src) => src.trim().length > 0).map(absoluteUrl);
}

export function productAvailability(stock: number, isActive = true): ProductAvailability {
  if (!isActive) return "Discontinued";
  return stock > 0 ? "InStock" : "OutOfStock";
}

export function productJsonLd(input: ProductJsonLdInput): ProductJsonLd {
  const url = absoluteUrl(input.url);
  const image = toImageList(input.images);
  const availability = productAvailability(input.stock, input.isActive ?? true);

  const result: ProductJsonLd = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Product",
    name: input.name,
    description: input.description,
    url,
    offers: {
      "@type": "Offer",
      url,
      price: roundMoney(input.price),
      priceCurrency: (input.currency ?? DEFAULT_CURRENCY).toUpperCase(),
      availability: `https://schema.org/${availability}`,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (image.length > 0) result.image = image;
  if (input.sku) result.sku = input.sku;
  if (input.category) result.category = input.category;
  if (input.brand) result.brand = { "@type": "Brand", name: input.brand };
  if (input.rating && input.rating.count > 0) {
    result.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Math.round(input.rating.value * 10) / 10,
      reviewCount: input.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return result;
}

export function organizationJsonLd(input: OrganizationJsonLdInput = {}): OrganizationJsonLd {
  const result: OrganizationJsonLd = {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: input.name ?? SITE_NAME,
    url: input.url ? absoluteUrl(input.url) : getSiteUrl(),
  };

  if (input.logo) result.logo = absoluteUrl(input.logo);
  if (input.sameAs && input.sameAs.length > 0) result.sameAs = [...input.sameAs];
  if (input.email) {
    result.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: input.email,
    };
  }

  return result;
}

export function breadcrumbJsonLd(items: readonly BreadcrumbItem[]): BreadcrumbJsonLd {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

/** Sitelinks search box; the catalog at /shop filters by `?q=`. */
export function websiteJsonLd(name: string = SITE_NAME): WebsiteJsonLd {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name,
    url: getSiteUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getSiteUrl()}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JSON.stringify with `<` escaped as `<` so the output can be embedded in a `<script>` tag
 * without a `</script>` inside user-generated text breaking out of it.
 */
export function serializeJsonLd(data: JsonLd | readonly JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
