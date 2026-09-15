import { afterEach, describe, expect, it, vi } from "vitest";
import robots, { DISALLOWED_PATHS } from "@/app/robots";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots()", () => {
  it("allows everything except private, API and checkout paths", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://shop.example.com");

    expect(robots()).toEqual({
      rules: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/account", "/api", "/checkout"],
        },
      ],
      sitemap: "https://shop.example.com/sitemap.xml",
      host: "https://shop.example.com",
    });
  });

  it("does not expose the exported list to mutation through the result", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = rule?.disallow;
    expect(Array.isArray(disallow)).toBe(true);
    expect(disallow).not.toBe(DISALLOWED_PATHS);
  });

  it("falls back to localhost without NEXT_PUBLIC_APP_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    expect(robots().sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
