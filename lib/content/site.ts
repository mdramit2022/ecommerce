import { cache } from "react";
import type { SiteContentKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_SITE_SETTINGS } from "@/lib/brand";
import {
  bannerSelect,
  groupFooterLinks,
  siteContentItemSelect,
  testimonialSelect,
  toBannerData,
  toSiteContentItemData,
  toTestimonialData,
} from "@/lib/content/serialize";
import { settingsFromRows } from "@/lib/content/settings";
import type { HomeContent, SiteContent } from "@/types/content";

/**
 * Storefront readers for admin-managed content. Server only. Active items only, in sort order,
 * memoised per request with React `cache` so the layout and the page share one query each.
 */

export const EMPTY_SITE_CONTENT: SiteContent = {
  announcements: [],
  trustBadges: [],
  socialLinks: [],
  footerColumns: [],
  settings: DEFAULT_SITE_SETTINGS,
};

export const EMPTY_HOME_CONTENT: HomeContent = {
  heroSlides: [],
  promoTiles: [],
  sideBanner: null,
  testimonials: [],
};

/** Announcement bar, trust badges, social links, footer columns and store settings. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const [items, settingRows] = await Promise.all([
    prisma.siteContentItem.findMany({
      where: { isActive: true },
      select: siteContentItemSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.siteSetting.findMany({ select: { key: true, value: true } }),
  ]);

  const data = items.map(toSiteContentItemData);
  const ofKind = (kind: SiteContentKind) => data.filter((item) => item.kind === kind);

  return {
    announcements: ofKind("ANNOUNCEMENT"),
    trustBadges: ofKind("TRUST_BADGE"),
    socialLinks: ofKind("SOCIAL_LINK"),
    footerColumns: groupFooterLinks(ofKind("FOOTER_LINK")),
    settings: settingsFromRows(settingRows),
  };
});

/**
 * Same as `getSiteContent` for the root layout, which must render even when the database is
 * down: failures are logged and the shell renders with defaults and no optional content.
 */
export async function getSiteContentSafe(): Promise<SiteContent> {
  try {
    return await getSiteContent();
  } catch (error) {
    console.error(
      "[layout] site content unavailable:",
      error instanceof Error ? error.message : String(error),
    );
    return EMPTY_SITE_CONTENT;
  }
}

/** Hero slides, promo tiles, the side banner and testimonials for the home page. */
export const getHomeContent = cache(async (): Promise<HomeContent> => {
  const [banners, testimonials] = await Promise.all([
    prisma.banner.findMany({
      where: { isActive: true },
      select: bannerSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.testimonial.findMany({
      where: { isActive: true },
      select: testimonialSelect,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const all = banners.map(toBannerData);

  return {
    heroSlides: all.filter((banner) => banner.placement === "HERO"),
    promoTiles: all.filter((banner) => banner.placement === "PROMO_TILE"),
    sideBanner: all.find((banner) => banner.placement === "SIDEBAR") ?? null,
    testimonials: testimonials.map(toTestimonialData),
  };
});
