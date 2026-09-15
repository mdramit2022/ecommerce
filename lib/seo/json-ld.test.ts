import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  productAvailability,
  productJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "./json-ld";

const SITE = "https://shop.example.com";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", SITE);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const baseProduct = {
  name: "Classic Cotton Tee",
  description: "Heavyweight organic cotton t-shirt with a relaxed fit.",
  url: "/products/classic-cotton-tee",
  price: 24,
  stock: 120,
};

describe("productAvailability", () => {
  it.each([
    [10, true, "InStock"],
    [1, true, "InStock"],
    [0, true, "OutOfStock"],
    [-3, true, "OutOfStock"],
    [10, false, "Discontinued"],
    [0, false, "Discontinued"],
  ] as const)("stock=%s isActive=%s -> %s", (stock, isActive, expected) => {
    expect(productAvailability(stock, isActive)).toBe(expected);
  });

  it("defaults isActive to true", () => {
    expect(productAvailability(5)).toBe("InStock");
  });
});

describe("productJsonLd", () => {
  it("builds a minimal Product with an Offer", () => {
    expect(productJsonLd(baseProduct)).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Classic Cotton Tee",
      description: "Heavyweight organic cotton t-shirt with a relaxed fit.",
      url: `${SITE}/products/classic-cotton-tee`,
      offers: {
        "@type": "Offer",
        url: `${SITE}/products/classic-cotton-tee`,
        price: 24,
        priceCurrency: "NPR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    });
  });

  it("omits optional properties that are not provided", () => {
    const result = productJsonLd(baseProduct);
    for (const key of ["image", "sku", "category", "brand", "aggregateRating"]) {
      expect(result).not.toHaveProperty(key);
    }
  });

  it("upper-cases the currency and rounds the price to 2dp", () => {
    const offers = productJsonLd({ ...baseProduct, price: 19.999, currency: "usd" }).offers;
    expect(offers.price).toBe(20);
    expect(offers.priceCurrency).toBe("USD");
    expect(productJsonLd({ ...baseProduct, price: 0.1 + 0.2 }).offers.price).toBe(0.3);
  });

  it("marks out-of-stock and inactive products", () => {
    expect(productJsonLd({ ...baseProduct, stock: 0 }).offers.availability).toBe(
      "https://schema.org/OutOfStock",
    );
    expect(productJsonLd({ ...baseProduct, isActive: false }).offers.availability).toBe(
      "https://schema.org/Discontinued",
    );
  });

  it("resolves images to absolute URLs and accepts a single string", () => {
    expect(
      productJsonLd({ ...baseProduct, images: ["/uploads/a.jpg", "https://cdn.example.com/b.jpg"] })
        .image,
    ).toEqual([`${SITE}/uploads/a.jpg`, "https://cdn.example.com/b.jpg"]);
    expect(productJsonLd({ ...baseProduct, images: "/uploads/only.jpg" }).image).toEqual([
      `${SITE}/uploads/only.jpg`,
    ]);
  });

  it.each([[], null, undefined, [""], ["   "]])("omits image for %j", (images) => {
    expect(productJsonLd({ ...baseProduct, images })).not.toHaveProperty("image");
  });

  it("includes sku, category and brand when given", () => {
    const result = productJsonLd({
      ...baseProduct,
      sku: "prod_tee",
      category: "Apparel",
      brand: "Ecommerce",
    });
    expect(result.sku).toBe("prod_tee");
    expect(result.category).toBe("Apparel");
    expect(result.brand).toEqual({ "@type": "Brand", name: "Ecommerce" });
  });

  it("includes an AggregateRating only when there are reviews", () => {
    expect(
      productJsonLd({ ...baseProduct, rating: { value: 4.333, count: 12 } }).aggregateRating,
    ).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.3,
      reviewCount: 12,
      bestRating: 5,
      worstRating: 1,
    });
    expect(productJsonLd({ ...baseProduct, rating: { value: 0, count: 0 } })).not.toHaveProperty(
      "aggregateRating",
    );
    expect(productJsonLd({ ...baseProduct, rating: null })).not.toHaveProperty("aggregateRating");
  });

  it("keeps absolute product URLs untouched", () => {
    const result = productJsonLd({ ...baseProduct, url: "https://other.example.com/p/1" });
    expect(result.url).toBe("https://other.example.com/p/1");
    expect(result.offers.url).toBe("https://other.example.com/p/1");
  });
});

describe("organizationJsonLd", () => {
  it("defaults to the site name and origin", () => {
    expect(organizationJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Laxmi Plastic Stores",
      url: SITE,
    });
  });

  it("resolves logo and url, copies sameAs and adds a contact point", () => {
    const result = organizationJsonLd({
      name: "Acme Goods",
      url: "/about",
      logo: "/logo.png",
      sameAs: ["https://x.com/acme", "https://instagram.com/acme"],
      email: "help@acme.example",
    });

    expect(result).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Acme Goods",
      url: `${SITE}/about`,
      logo: `${SITE}/logo.png`,
      sameAs: ["https://x.com/acme", "https://instagram.com/acme"],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "help@acme.example",
      },
    });
  });

  it("omits empty sameAs and null logo/email", () => {
    const result = organizationJsonLd({ sameAs: [], logo: null, email: null });
    expect(result).not.toHaveProperty("sameAs");
    expect(result).not.toHaveProperty("logo");
    expect(result).not.toHaveProperty("contactPoint");
  });

  it("does not share the caller's sameAs array", () => {
    const sameAs = ["https://x.com/acme"];
    const result = organizationJsonLd({ sameAs });
    sameAs.push("https://mutated.example");
    expect(result.sameAs).toEqual(["https://x.com/acme"]);
  });
});

describe("breadcrumbJsonLd", () => {
  it("numbers positions from 1 and resolves item URLs", () => {
    expect(
      breadcrumbJsonLd([
        { name: "Shop", url: "/" },
        { name: "Apparel", url: "/?category=apparel" },
        { name: "Classic Cotton Tee", url: "/products/classic-cotton-tee" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Shop", item: `${SITE}/` },
        { "@type": "ListItem", position: 2, name: "Apparel", item: `${SITE}/?category=apparel` },
        {
          "@type": "ListItem",
          position: 3,
          name: "Classic Cotton Tee",
          item: `${SITE}/products/classic-cotton-tee`,
        },
      ],
    });
  });

  it("handles an empty trail", () => {
    expect(breadcrumbJsonLd([]).itemListElement).toEqual([]);
  });
});

describe("websiteJsonLd", () => {
  it("advertises the storefront search box", () => {
    expect(websiteJsonLd()).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Laxmi Plastic Stores",
      url: SITE,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE}/shop?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    });
  });
});

describe("serializeJsonLd", () => {
  it("produces valid JSON", () => {
    const data = productJsonLd(baseProduct);
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("escapes < so user text cannot close the script tag", () => {
    const serialised = serializeJsonLd(
      productJsonLd({ ...baseProduct, description: "</script><script>alert(1)</script>" }),
    );

    expect(serialised).not.toContain("<");
    expect(serialised).toContain("\\u003c/script>");
    // Still decodes to the original text.
    expect(JSON.parse(serialised).description).toBe("</script><script>alert(1)</script>");
  });

  it("serialises an array of graphs", () => {
    const parsed: unknown = JSON.parse(serializeJsonLd([organizationJsonLd(), websiteJsonLd()]));
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(2);
  });
});
