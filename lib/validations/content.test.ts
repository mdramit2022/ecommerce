import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  bannerSchema,
  linkHrefSchema,
  siteContentItemSchema,
  siteSettingsSchema,
  testimonialSchema,
} from "./content";

function failedPaths(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  return [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
}

describe("linkHrefSchema", () => {
  it.each([
    "/shop",
    "/shop?onSale=true",
    "https://facebook.com/x",
    "http://localhost:3000/a",
    "tel:+97715912345",
    "mailto:a@b.co",
  ])("accepts %s", (href) => {
    expect(linkHrefSchema.safeParse(href).success).toBe(true);
  });

  it.each(["//evil.com", "javascript:alert(1)", "shop", "ftp://x", "", "   "])(
    "rejects %j",
    (href) => {
      expect(linkHrefSchema.safeParse(href).success).toBe(false);
    },
  );
});

describe("bannerSchema", () => {
  const base = {
    placement: "HERO",
    title: "Everything Your",
    titleAccent: "Kitchen Needs",
    image: "https://images.example.com/hero.jpg",
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
  };

  it("accepts a hero slide and applies defaults", () => {
    const result = bannerSchema.parse(base);
    expect(result.sortOrder).toBe(0);
    expect(result.isActive).toBe(true);
    expect(result.eyebrow).toBeUndefined();
  });

  it("turns blank optional fields into null", () => {
    const result = bannerSchema.parse({ ...base, eyebrow: "  ", highlight: "", theme: "" });
    expect(result.eyebrow).toBeNull();
    expect(result.highlight).toBeNull();
    expect(result.theme).toBeNull();
  });

  it("requires a button label and link together", () => {
    expect(failedPaths(bannerSchema.safeParse({ ...base, ctaHref: "" }))).toEqual(["ctaHref"]);
    expect(failedPaths(bannerSchema.safeParse({ ...base, ctaLabel: "" }))).toEqual(["ctaLabel"]);
    expect(
      failedPaths(bannerSchema.safeParse({ ...base, secondaryLabel: "More", secondaryHref: "" })),
    ).toEqual(["secondaryHref"]);
  });

  it("requires title, image and a known placement", () => {
    expect(failedPaths(bannerSchema.safeParse({ ...base, title: " " }))).toEqual(["title"]);
    expect(failedPaths(bannerSchema.safeParse({ ...base, image: "not-a-url" }))).toEqual(["image"]);
    expect(failedPaths(bannerSchema.safeParse({ ...base, placement: "FOOTER" }))).toEqual([
      "placement",
    ]);
  });

  it("accepts an /uploads/ image path and a known theme", () => {
    const result = bannerSchema.parse({
      ...base,
      placement: "PROMO_TILE",
      image: "/uploads/abc123.png",
      theme: "teal",
    });
    expect(result.theme).toBe("teal");
  });

  it("rejects an unknown theme and a protocol-relative link", () => {
    expect(failedPaths(bannerSchema.safeParse({ ...base, theme: "pink" }))).toEqual(["theme"]);
    expect(failedPaths(bannerSchema.safeParse({ ...base, ctaHref: "//evil.com" }))).toEqual([
      "ctaHref",
    ]);
  });

  it("coerces sortOrder from form strings", () => {
    expect(bannerSchema.parse({ ...base, sortOrder: "3" }).sortOrder).toBe(3);
    expect(failedPaths(bannerSchema.safeParse({ ...base, sortOrder: "-1" }))).toEqual([
      "sortOrder",
    ]);
  });
});

describe("testimonialSchema", () => {
  const base = {
    quote: "Excellent products and very fair prices.",
    authorName: "Sita Sharma",
    rating: "5",
  };

  it("accepts a testimonial and coerces the rating", () => {
    const result = testimonialSchema.parse(base);
    expect(result.rating).toBe(5);
    expect(result.avatar).toBeUndefined();
    expect(result.isActive).toBe(true);
  });

  it.each(["0", "6", "abc"])("rejects rating %j", (rating) => {
    expect(failedPaths(testimonialSchema.safeParse({ ...base, rating }))).toEqual(["rating"]);
  });

  it("requires a real quote and a name", () => {
    expect(failedPaths(testimonialSchema.safeParse({ ...base, quote: "Nice" }))).toEqual(["quote"]);
    expect(failedPaths(testimonialSchema.safeParse({ ...base, authorName: "S" }))).toEqual([
      "authorName",
    ]);
  });

  it("treats a blank avatar as null", () => {
    expect(testimonialSchema.parse({ ...base, avatar: "" }).avatar).toBeNull();
  });
});

describe("siteContentItemSchema", () => {
  it("validates an announcement (text + icon)", () => {
    expect(
      siteContentItemSchema.safeParse({
        kind: "ANNOUNCEMENT",
        title: "Free delivery",
        icon: "truck",
      }).success,
    ).toBe(true);
    expect(
      failedPaths(
        siteContentItemSchema.safeParse({ kind: "ANNOUNCEMENT", title: "", icon: "truck" }),
      ),
    ).toEqual(["title"]);
    expect(
      failedPaths(
        siteContentItemSchema.safeParse({ kind: "ANNOUNCEMENT", title: "x", icon: "facebook" }),
      ),
    ).toEqual(["icon"]);
  });

  it("validates a trust badge (title + icon, subtitle optional)", () => {
    expect(
      siteContentItemSchema.safeParse({
        kind: "TRUST_BADGE",
        title: "Quality",
        icon: "badge-check",
      }).success,
    ).toBe(true);
    expect(
      failedPaths(siteContentItemSchema.safeParse({ kind: "TRUST_BADGE", title: "Quality" })),
    ).toEqual(["icon"]);
  });

  it("validates a social link (network + url)", () => {
    expect(
      siteContentItemSchema.safeParse({
        kind: "SOCIAL_LINK",
        icon: "facebook",
        href: "https://facebook.com/laxmi",
      }).success,
    ).toBe(true);
    expect(
      failedPaths(
        siteContentItemSchema.safeParse({
          kind: "SOCIAL_LINK",
          icon: "truck",
          href: "https://x.y",
        }),
      ),
    ).toEqual(["icon"]);
    expect(
      failedPaths(siteContentItemSchema.safeParse({ kind: "SOCIAL_LINK", icon: "tiktok" })),
    ).toEqual(["href"]);
  });

  it("validates a footer link (column + label + link)", () => {
    expect(
      siteContentItemSchema.safeParse({
        kind: "FOOTER_LINK",
        group: "Shop",
        title: "All Products",
        href: "/shop",
      }).success,
    ).toBe(true);
    expect(
      failedPaths(
        siteContentItemSchema.safeParse({ kind: "FOOTER_LINK", title: "x", href: "/shop" }),
      ),
    ).toEqual(["group"]);
    expect(
      failedPaths(
        siteContentItemSchema.safeParse({
          kind: "FOOTER_LINK",
          group: "Shop",
          title: "x",
          href: "//evil.com",
        }),
      ),
    ).toEqual(["href"]);
  });

  it("rejects unknown kinds", () => {
    expect(failedPaths(siteContentItemSchema.safeParse({ kind: "HERO", title: "x" }))).toContain(
      "kind",
    );
  });
});

describe("siteSettingsSchema", () => {
  const base = {
    phone: "+977-1-5912345",
    email: "hello@laxmiplasticstores.com",
    addressLine: "Bafal, Kathmandu",
    hours: "9:00 AM - 8:00 PM (Everyday)",
    directionsUrl: "https://maps.google.com/?q=Bafal",
    freeDeliveryThreshold: "2000",
    yearsInBusiness: "26",
    newsletterBlurb: "Get updates about new products.",
  };

  it("accepts the store settings and coerces numbers", () => {
    const result = siteSettingsSchema.parse(base);
    expect(result.freeDeliveryThreshold).toBe(2000);
    expect(result.yearsInBusiness).toBe(26);
  });

  it.each([
    ["phone", "12"],
    ["email", "nope"],
    ["directionsUrl", "maps.google.com"],
    ["yearsInBusiness", "26.5"],
    ["freeDeliveryThreshold", "-1"],
  ])("rejects a bad %s", (field, value) => {
    expect(failedPaths(siteSettingsSchema.safeParse({ ...base, [field]: value }))).toEqual([field]);
  });
});
