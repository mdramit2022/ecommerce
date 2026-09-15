import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SITE_URL, SITE_NAME, absoluteUrl, getSiteUrl } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSiteUrl", () => {
  it("falls back to localhost when NEXT_PUBLIC_APP_URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    expect(DEFAULT_SITE_URL).toBe("http://localhost:3000");
  });

  it("returns the configured origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");
    expect(getSiteUrl()).toBe("https://shop.example.com");
  });

  it.each([
    "https://shop.example.com/",
    "https://shop.example.com///",
    "  https://shop.example.com/ ",
  ])("strips trailing slashes and whitespace from %j", (value) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", value);
    expect(getSiteUrl()).toBe("https://shop.example.com");
  });

  it("keeps a base path", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.com/shop/");
    expect(getSiteUrl()).toBe("https://example.com/shop");
  });

  it.each(["not a url", "shop.example.com", "ftp://shop.example.com", "javascript:alert(1)"])(
    "ignores the invalid value %j",
    (value) => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", value);
      expect(getSiteUrl()).toBe(DEFAULT_SITE_URL);
    },
  );
});

describe("absoluteUrl", () => {
  it("prefixes site-relative paths with the origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");
    expect(absoluteUrl("/products/classic-cotton-tee")).toBe(
      "https://shop.example.com/products/classic-cotton-tee",
    );
    expect(absoluteUrl("/")).toBe("https://shop.example.com/");
  });

  it("adds the missing leading slash", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");
    expect(absoluteUrl("sitemap.xml")).toBe("https://shop.example.com/sitemap.xml");
  });

  it("passes absolute URLs through untouched", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");
    expect(absoluteUrl("https://cdn.example.com/a.jpg")).toBe("https://cdn.example.com/a.jpg");
    expect(absoluteUrl("HTTP://cdn.example.com/a.jpg")).toBe("HTTP://cdn.example.com/a.jpg");
  });

  it("preserves query strings", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");
    expect(absoluteUrl("/?category=apparel")).toBe("https://shop.example.com/?category=apparel");
  });
});

describe("constants", () => {
  it("exposes the site name used in metadata", () => {
    expect(SITE_NAME).toBe("Laxmi Plastic Stores");
  });
});
