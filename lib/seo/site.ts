import { BRAND } from "@/lib/brand";

/**
 * Site-wide SEO constants and URL helpers.
 *
 * Reads `process.env` directly instead of importing `@/lib/env` so this module is safe to use in
 * `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, unit tests and CI builds where the full
 * server environment (DATABASE_URL, AUTH_SECRET, ...) is not available.
 */

export const SITE_NAME: string = BRAND.name;
export const SITE_DESCRIPTION: string = `${BRAND.tagline}. ${BRAND.description}`;

export const DEFAULT_SITE_URL = "http://localhost:3000";

/** Public origin of the site without a trailing slash, e.g. `https://shop.example.com`. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const candidate = raw && raw.length > 0 ? raw : DEFAULT_SITE_URL;

  try {
    // Validate; keep the original string (minus trailing slashes) so a base path survives.
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEFAULT_SITE_URL;
    return candidate.replace(/\/+$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/** Resolve a site-relative path (or pass through an absolute URL) against the site origin. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalised}`;
}
