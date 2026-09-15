import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { categoryFindMany, productFindMany } = vi.hoisted(() => ({
  categoryFindMany: vi.fn(),
  productFindMany: vi.fn(),
}));

// The real module constructs a PrismaClient; swap it for stubs so no database is needed.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findMany: categoryFindMany },
    product: { findMany: productFindMany },
  },
}));

import sitemap, { dynamic } from "@/app/sitemap";

const SITE = "https://shop.example.com";
const NOW = new Date("2026-09-10T12:00:00.000Z");

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", SITE);
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  categoryFindMany.mockReset();
  productFindMany.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("sitemap()", () => {
  it("is rendered per request rather than at build time", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("lists the home page, the shop, category filters and active product pages", async () => {
    const categoryDate = new Date("2026-09-01T00:00:00.000Z");
    const productDate = new Date("2026-09-05T00:00:00.000Z");
    categoryFindMany.mockResolvedValue([
      { slug: "apparel", updatedAt: categoryDate },
      { slug: "home", updatedAt: categoryDate },
    ]);
    productFindMany.mockResolvedValue([
      { slug: "classic-cotton-tee", updatedAt: productDate },
      { slug: "linen-throw-blanket", updatedAt: productDate },
    ]);

    const entries = await sitemap();

    expect(entries.map((e) => e.url)).toEqual([
      `${SITE}/`,
      `${SITE}/shop`,
      `${SITE}/shop?category=apparel`,
      `${SITE}/shop?category=home`,
      `${SITE}/products/classic-cotton-tee`,
      `${SITE}/products/linen-throw-blanket`,
    ]);
    expect(entries[0]).toEqual({
      url: `${SITE}/`,
      lastModified: NOW,
      changeFrequency: "daily",
      priority: 1,
    });
    expect(entries[1]).toMatchObject({ url: `${SITE}/shop`, priority: 0.9 });
    expect(entries[2]).toMatchObject({ lastModified: categoryDate, priority: 0.7 });
    expect(entries[4]).toMatchObject({ lastModified: productDate, priority: 0.8 });
  });

  it("only asks for active products and categories that have active products", async () => {
    categoryFindMany.mockResolvedValue([]);
    productFindMany.mockResolvedValue([]);

    await sitemap();

    expect(productFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    );
    expect(categoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { products: { some: { isActive: true } } } }),
    );
  });

  it("URL-encodes slugs so the XML stays well-formed", async () => {
    categoryFindMany.mockResolvedValue([{ slug: "tea&coffee", updatedAt: NOW }]);
    productFindMany.mockResolvedValue([{ slug: "size <xl>", updatedAt: NOW }]);

    const urls = (await sitemap()).map((e) => e.url);

    expect(urls).toContain(`${SITE}/shop?category=tea%26coffee`);
    expect(urls).toContain(`${SITE}/products/size%20%3Cxl%3E`);
    for (const url of urls) {
      expect(url).not.toMatch(/[<>&]/);
    }
  });

  it("falls back to the static entries when the database is unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    categoryFindMany.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:5432"));
    productFindMany.mockRejectedValue(new Error("connect ECONNREFUSED 127.0.0.1:5432"));

    const entries = await sitemap();

    expect(entries).toEqual([
      { url: `${SITE}/`, lastModified: NOW, changeFrequency: "daily", priority: 1 },
      { url: `${SITE}/shop`, lastModified: NOW, changeFrequency: "daily", priority: 0.9 },
    ]);
    expect(consoleError).toHaveBeenCalledTimes(1);
    // Only the message is logged, never the stack.
    expect(consoleError.mock.calls[0]?.[1]).toBe("connect ECONNREFUSED 127.0.0.1:5432");
  });

  it("handles non-Error rejections without throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    categoryFindMany.mockRejectedValue("boom");
    productFindMany.mockResolvedValue([]);

    await expect(sitemap()).resolves.toHaveLength(2);
  });
});
