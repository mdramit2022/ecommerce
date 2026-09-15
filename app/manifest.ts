import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo/site";

/**
 * /manifest.webmanifest
 * Minimal web app manifest. Colours mirror the storefront shell (brand surface / brand navy).
 * Add `icons` once brand assets exist under /public (e.g. /icon-192.png and /icon-512.png).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: BRAND.nameAccent,
    description: SITE_DESCRIPTION,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en",
    dir: "ltr",
    background_color: "#f4f6fa",
    theme_color: "#0b2a5b",
    categories: ["shopping"],
  };
}
