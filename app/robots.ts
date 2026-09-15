import type { MetadataRoute } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";

/** Paths that must never be indexed: private areas, JSON APIs and the payment flow. */
export const DISALLOWED_PATHS: readonly string[] = ["/admin", "/account", "/api", "/checkout"];

/** /robots.txt */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] }],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: getSiteUrl(),
  };
}
