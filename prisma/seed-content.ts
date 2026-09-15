import type { PrismaClient, SiteContentKind } from "@prisma/client";
import {
  DEFAULT_ANNOUNCEMENTS,
  DEFAULT_BANNERS,
  DEFAULT_FOOTER_LINKS,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_SOCIAL_LINKS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_TRUST_BADGES,
  type ContentItemSeed,
} from "../lib/brand";
import { BANNER_PLACEMENTS } from "../lib/content/kinds";
import { settingsToRows } from "../lib/content/settings";

/**
 * Seed the admin-managed storefront content - ONCE. Each kind is only written when its table is
 * empty, and settings only when the key is missing, so re-running the seed never overwrites what
 * an admin changed in /admin/banners, /admin/testimonials, /admin/content or /admin/settings.
 */
export async function seedStorefrontContent(prisma: PrismaClient): Promise<{
  items: number;
  banners: number;
  testimonials: number;
  settings: number;
}> {
  const itemSeeds: Array<[SiteContentKind, readonly ContentItemSeed[]]> = [
    ["ANNOUNCEMENT", DEFAULT_ANNOUNCEMENTS],
    ["TRUST_BADGE", DEFAULT_TRUST_BADGES],
    ["SOCIAL_LINK", DEFAULT_SOCIAL_LINKS],
    ["FOOTER_LINK", DEFAULT_FOOTER_LINKS],
  ];

  let items = 0;
  for (const [kind, seeds] of itemSeeds) {
    const existing = await prisma.siteContentItem.count({ where: { kind } });
    if (existing > 0) continue;
    await prisma.siteContentItem.createMany({
      data: seeds.map((seed, index) => ({
        kind,
        group: seed.group ?? null,
        title: seed.title ?? null,
        subtitle: seed.subtitle ?? null,
        href: seed.href ?? null,
        icon: seed.icon ?? null,
        sortOrder: index,
      })),
    });
    items += seeds.length;
  }

  let banners = 0;
  for (const placement of BANNER_PLACEMENTS) {
    const existing = await prisma.banner.count({ where: { placement } });
    if (existing > 0) continue;
    const seeds = DEFAULT_BANNERS.filter((banner) => banner.placement === placement);
    await prisma.banner.createMany({
      data: seeds.map((seed, index) => ({
        placement: seed.placement,
        eyebrow: seed.eyebrow ?? null,
        title: seed.title,
        titleAccent: seed.titleAccent ?? null,
        highlight: seed.highlight ?? null,
        description: seed.description ?? null,
        image: seed.image,
        ctaLabel: seed.ctaLabel ?? null,
        ctaHref: seed.ctaHref ?? null,
        secondaryLabel: seed.secondaryLabel ?? null,
        secondaryHref: seed.secondaryHref ?? null,
        theme: seed.theme ?? null,
        sortOrder: index,
      })),
    });
    banners += seeds.length;
  }

  let testimonials = 0;
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: DEFAULT_TESTIMONIALS.map((seed, index) => ({ ...seed, sortOrder: index })),
    });
    testimonials = DEFAULT_TESTIMONIALS.length;
  }

  const settingRows = settingsToRows(DEFAULT_SITE_SETTINGS);
  const written = await prisma.siteSetting.createMany({ data: settingRows, skipDuplicates: true });

  return { items, banners, testimonials, settings: written.count };
}
