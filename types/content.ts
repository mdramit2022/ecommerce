import type { BannerPlacement, SiteContentKind } from "@prisma/client";
import type { SiteSettings } from "@/lib/content/kinds";

/**
 * Serialisable shapes for admin-managed storefront content (no Date, no Decimal).
 * Shared by Server Components, Client Components (admin forms) and the seed.
 */

export type BannerData = {
  id: string;
  placement: BannerPlacement;
  eyebrow: string | null;
  title: string;
  titleAccent: string | null;
  highlight: string | null;
  description: string | null;
  image: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  secondaryLabel: string | null;
  secondaryHref: string | null;
  theme: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};

export type TestimonialData = {
  id: string;
  quote: string;
  authorName: string;
  location: string | null;
  rating: number;
  avatar: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SiteContentItemData = {
  id: string;
  kind: SiteContentKind;
  group: string | null;
  title: string;
  subtitle: string | null;
  href: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type FooterColumnData = {
  heading: string;
  links: SiteContentItemData[];
};

/** Everything the shell (announcement bar, header drawer, footer) needs, active items only. */
export type SiteContent = {
  announcements: SiteContentItemData[];
  trustBadges: SiteContentItemData[];
  socialLinks: SiteContentItemData[];
  footerColumns: FooterColumnData[];
  settings: SiteSettings;
};

/** Home-page marketing content, active items only, in sort order. */
export type HomeContent = {
  heroSlides: BannerData[];
  promoTiles: BannerData[];
  sideBanner: BannerData | null;
  testimonials: TestimonialData[];
};
