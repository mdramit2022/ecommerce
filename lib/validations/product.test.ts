import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  adminProductListQuerySchema,
  productCreateSchema,
  productImageSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "./product";

/** Distinct `path` strings of failed issues, e.g. ["price", "images.0"]. */
function failedPaths(result: z.SafeParseReturnType<unknown, unknown>): string[] {
  if (result.success) return [];
  return [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
}

describe("productImageSchema", () => {
  it.each([
    "https://images.example.com/tee.jpg",
    "http://localhost:3000/img.png",
    "https://cdn.example.com/path/to/file.webp?w=800",
    "/uploads/abc123.jpg",
    "/uploads/photo_2026-09-10.PNG",
  ])("accepts %s", (value) => {
    expect(productImageSchema.parse(value)).toBe(value);
  });

  it.each([
    "",
    "   ",
    "not-a-url",
    "tee.jpg",
    "/images/tee.jpg", // only /uploads/ is allowed for relative paths
    "/uploads/", // missing file name
    "/uploads/../secret.txt", // traversal characters are not in the allow-list
    "/uploads/sub/dir.jpg", // no nested directories
    "/uploads/with space.jpg",
    `https://cdn.example.com/${"a".repeat(2048)}`, // over 2048 characters
  ])("rejects %j", (value) => {
    expect(productImageSchema.safeParse(value).success).toBe(false);
  });

  it("trims surrounding whitespace before validating", () => {
    expect(productImageSchema.parse("  /uploads/abc.jpg  ")).toBe("/uploads/abc.jpg");
  });
});

describe("productListQuerySchema", () => {
  it("applies defaults to an empty query", () => {
    const result = productListQuerySchema.parse({});

    expect(result).toEqual({
      page: 1,
      limit: 12,
      sort: "newest",
      featured: false,
      onSale: false,
      includeInactive: false,
    });
    expect(result.category).toBeUndefined();
    expect(result.q).toBeUndefined();
  });

  it.each([
    ["true", true],
    ["false", false],
    [undefined, false],
  ])("normalises includeInactive=%j to %s", (raw, expected) => {
    expect(productListQuerySchema.parse({ includeInactive: raw }).includeInactive).toBe(expected);
  });

  it.each(["1", "yes", "TRUE", ""])("rejects includeInactive=%j", (includeInactive) => {
    expect(failedPaths(productListQuerySchema.safeParse({ includeInactive }))).toEqual([
      "includeInactive",
    ]);
  });

  it("coerces numeric strings from the URL", () => {
    const result = productListQuerySchema.parse({ page: "3", limit: "24" });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(24);
  });

  it.each([
    ["page", "0"],
    ["page", "-1"],
    ["page", "1.5"],
    ["page", "abc"],
    ["page", ""], // coerces to 0, which fails min(1)
    ["limit", "0"],
    ["limit", "61"],
    ["limit", "2.5"],
    ["limit", "many"],
  ])("rejects %s=%j", (key, value) => {
    const result = productListQuerySchema.safeParse({ [key]: value });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual([key]);
  });

  it("accepts the limit boundaries", () => {
    expect(productListQuerySchema.parse({ limit: "1" }).limit).toBe(1);
    expect(productListQuerySchema.parse({ limit: "60" }).limit).toBe(60);
  });

  it("trims category and q", () => {
    const result = productListQuerySchema.parse({ category: "  apparel ", q: " tee " });
    expect(result.category).toBe("apparel");
    expect(result.q).toBe("tee");
  });

  it("rejects blank category and q (empty after trim)", () => {
    expect(productListQuerySchema.safeParse({ category: "   " }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ q: "" }).success).toBe(false);
  });

  it("caps the search term at 100 characters", () => {
    expect(productListQuerySchema.safeParse({ q: "a".repeat(100) }).success).toBe(true);
    expect(productListQuerySchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
  });

  it.each(["newest", "price-asc", "price-desc", "title"] as const)("accepts sort=%s", (sort) => {
    expect(productListQuerySchema.parse({ sort }).sort).toBe(sort);
  });

  it("rejects unknown sort values", () => {
    expect(productListQuerySchema.safeParse({ sort: "popular" }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ sort: "PRICE-ASC" }).success).toBe(false);
  });

  it("strips unknown keys", () => {
    const result = productListQuerySchema.parse({ utm_source: "newsletter", page: "2" });
    expect(result).not.toHaveProperty("utm_source");
  });
});

describe("productCreateSchema", () => {
  const valid = {
    title: "Classic Cotton Tee",
    description: "Heavyweight organic cotton t-shirt with a relaxed fit.",
    price: 24,
    categoryId: "cat_apparel",
  };

  it("accepts a minimal body and fills defaults", () => {
    const result = productCreateSchema.parse(valid);

    expect(result).toEqual({
      ...valid,
      stock: 0,
      images: [],
      isActive: true,
      isFeatured: false,
    });
    expect(result.slug).toBeUndefined();
    expect(result.compareAtPrice).toBeUndefined();
  });

  it("accepts a fully specified body", () => {
    const body = {
      ...valid,
      slug: "classic-cotton-tee",
      price: 24.99,
      compareAtPrice: 32.5,
      stock: 120,
      images: ["https://images.example.com/tee.jpg"],
      isActive: false,
      isFeatured: true,
    };
    expect(productCreateSchema.parse(body)).toEqual(body);
  });

  describe("slug", () => {
    it.each(["ab", "abc", "a-b", "a1-b2-c3", "classic-cotton-tee", "2026-drop", "x".repeat(200)])(
      "accepts %j",
      (slug) => {
        expect(productCreateSchema.safeParse({ ...valid, slug }).success).toBe(true);
      },
    );

    it.each([
      "a", // too short
      "Abc", // uppercase
      "a b", // whitespace
      "a_b", // underscore
      "a--b", // double hyphen
      "-ab", // leading hyphen
      "ab-", // trailing hyphen
      "café", // non-ascii
      "a/b", // slash
      "x".repeat(201), // too long
    ])("rejects %j", (slug) => {
      const result = productCreateSchema.safeParse({ ...valid, slug });
      expect(result.success).toBe(false);
      expect(failedPaths(result)).toContain("slug");
    });

    it("trims before validating", () => {
      const result = productCreateSchema.parse({ ...valid, slug: "  classic-tee  " });
      expect(result.slug).toBe("classic-tee");
    });

    it("is optional so the server can derive it from the title", () => {
      expect(productCreateSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe("price", () => {
    it.each([0.01, 1, 10, 19.99, 24, 1234.56, 99999999.99])("accepts %s", (price) => {
      expect(productCreateSchema.safeParse({ ...valid, price }).success).toBe(true);
    });

    it.each([0, -1, -0.01, 19.999, 0.001, Number.NaN])("rejects %s", (price) => {
      const result = productCreateSchema.safeParse({ ...valid, price });
      expect(result.success).toBe(false);
      expect(failedPaths(result)).toContain("price");
    });

    it("rejects numeric strings (bodies must be typed JSON, not form strings)", () => {
      expect(productCreateSchema.safeParse({ ...valid, price: "24.00" }).success).toBe(false);
    });
  });

  describe("compareAtPrice", () => {
    it("accepts null, undefined and a positive 2dp number", () => {
      expect(
        productCreateSchema.parse({ ...valid, compareAtPrice: null }).compareAtPrice,
      ).toBeNull();
      expect(productCreateSchema.parse({ ...valid }).compareAtPrice).toBeUndefined();
      expect(productCreateSchema.parse({ ...valid, compareAtPrice: 32.5 }).compareAtPrice).toBe(
        32.5,
      );
    });

    it.each([0, -5, 32.505])("rejects %s", (compareAtPrice) => {
      const result = productCreateSchema.safeParse({ ...valid, compareAtPrice });
      expect(failedPaths(result)).toContain("compareAtPrice");
    });
  });

  describe("stock", () => {
    it("accepts zero and positive integers", () => {
      expect(productCreateSchema.parse({ ...valid, stock: 0 }).stock).toBe(0);
      expect(productCreateSchema.parse({ ...valid, stock: 500 }).stock).toBe(500);
    });

    it.each([-1, 1.5, "10"])("rejects %j", (stock) => {
      expect(failedPaths(productCreateSchema.safeParse({ ...valid, stock }))).toContain("stock");
    });
  });

  describe("images", () => {
    it("accepts up to 10 absolute URLs", () => {
      const images = Array.from({ length: 10 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
      expect(productCreateSchema.parse({ ...valid, images }).images).toEqual(images);
    });

    it("accepts uploaded /uploads/ paths alongside absolute URLs", () => {
      const images = ["/uploads/abc123.jpg", "https://cdn.example.com/1.jpg"];
      expect(productCreateSchema.parse({ ...valid, images }).images).toEqual(images);
    });

    it("rejects more than 10 images", () => {
      const images = Array.from({ length: 11 }, (_, i) => `https://cdn.example.com/${i}.jpg`);
      expect(failedPaths(productCreateSchema.safeParse({ ...valid, images }))).toContain("images");
    });

    it("rejects entries that are not URLs and reports the index", () => {
      const result = productCreateSchema.safeParse({
        ...valid,
        images: ["https://cdn.example.com/ok.jpg", "not-a-url"],
      });
      expect(failedPaths(result)).toEqual(["images.1"]);
    });
  });

  describe("text fields", () => {
    it("trims title and description", () => {
      const result = productCreateSchema.parse({
        ...valid,
        title: "  Tee  ",
        description: "  A description that is long enough.  ",
      });
      expect(result.title).toBe("Tee");
      expect(result.description).toBe("A description that is long enough.");
    });

    it.each([
      ["title", "T"],
      ["title", " "],
      ["title", "x".repeat(201)],
      ["description", "too short"],
      ["description", "x".repeat(5001)],
      ["categoryId", ""],
    ])("rejects %s=%j", (key, value) => {
      const result = productCreateSchema.safeParse({ ...valid, [key]: value });
      expect(failedPaths(result)).toContain(key);
    });

    it("requires title, description, price and categoryId", () => {
      const result = productCreateSchema.safeParse({});
      expect(failedPaths(result).sort()).toEqual(
        ["categoryId", "description", "price", "title"].sort(),
      );
    });
  });

  it("rejects non-boolean flags", () => {
    expect(failedPaths(productCreateSchema.safeParse({ ...valid, isActive: "yes" }))).toContain(
      "isActive",
    );
    expect(failedPaths(productCreateSchema.safeParse({ ...valid, isFeatured: 1 }))).toContain(
      "isFeatured",
    );
  });

  it("strips unknown keys", () => {
    const result = productCreateSchema.parse({ ...valid, id: "client-supplied", createdAt: "now" });
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("createdAt");
  });
});

describe("productUpdateSchema", () => {
  it("accepts a single field", () => {
    expect(productUpdateSchema.parse({ stock: 5 })).toEqual({ stock: 5 });
    expect(productUpdateSchema.parse({ isActive: false })).toEqual({ isActive: false });
  });

  it("does not inject create defaults for omitted fields", () => {
    const result = productUpdateSchema.parse({ title: "Renamed product" });

    expect(result).toEqual({ title: "Renamed product" });
    expect(result).not.toHaveProperty("stock");
    expect(result).not.toHaveProperty("images");
    expect(result).not.toHaveProperty("isActive");
  });

  it("rejects an empty patch with a clear message", () => {
    const result = productUpdateSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Provide at least one field to update");
    }
  });

  it("treats a patch of only undefined values as empty", () => {
    expect(productUpdateSchema.safeParse({ title: undefined, stock: undefined }).success).toBe(
      false,
    );
  });

  it("still applies the field rules from the create schema", () => {
    expect(failedPaths(productUpdateSchema.safeParse({ price: 19.999 }))).toEqual(["price"]);
    expect(failedPaths(productUpdateSchema.safeParse({ slug: "Not Kebab" }))).toEqual(["slug"]);
    expect(failedPaths(productUpdateSchema.safeParse({ stock: -1 }))).toEqual(["stock"]);
  });

  it("allows clearing compareAtPrice with null", () => {
    expect(productUpdateSchema.parse({ compareAtPrice: null })).toEqual({ compareAtPrice: null });
  });
});

describe("adminProductListQuerySchema", () => {
  it("applies admin defaults (larger page, all statuses)", () => {
    expect(adminProductListQuerySchema.parse({})).toEqual({ page: 1, limit: 20, status: "all" });
  });

  it("allows a higher limit than the storefront but caps it at 100", () => {
    expect(adminProductListQuerySchema.parse({ limit: "100" }).limit).toBe(100);
    expect(failedPaths(adminProductListQuerySchema.safeParse({ limit: "101" }))).toEqual(["limit"]);
  });

  it.each(["all", "active", "inactive"] as const)("accepts status=%s", (status) => {
    expect(adminProductListQuerySchema.parse({ status }).status).toBe(status);
  });

  it("rejects unknown statuses", () => {
    expect(failedPaths(adminProductListQuerySchema.safeParse({ status: "archived" }))).toEqual([
      "status",
    ]);
  });

  it("coerces page and trims text filters like the storefront schema", () => {
    const result = adminProductListQuerySchema.parse({ page: "4", q: " tee ", category: " home " });
    expect(result).toEqual({ page: 4, limit: 20, status: "all", q: "tee", category: "home" });
  });
});
