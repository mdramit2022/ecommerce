import type { Prisma } from "@prisma/client";
import type {
  BannerData,
  FooterColumnData,
  SiteContentItemData,
  TestimonialData,
} from "@/types/content";

/**
 * Prisma selects + serializers for admin-managed content. Types only from @prisma/client, so the
 * pure helpers here (footer grouping) are unit-testable; the loaders live in lib/content/site.ts
 * and lib/admin/content.ts.
 */

export const bannerSelect = {
  id: true,
  placement: true,
  eyebrow: true,
  title: true,
  titleAccent: true,
  highlight: true,
  description: true,
  image: true,
  ctaLabel: true,
  ctaHref: true,
  secondaryLabel: true,
  secondaryHref: true,
  theme: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BannerSelect;

export type BannerRow = Prisma.BannerGetPayload<{ select: typeof bannerSelect }>;

export function toBannerData(row: BannerRow): BannerData {
  return {
    id: row.id,
    placement: row.placement,
    eyebrow: row.eyebrow,
    title: row.title,
    titleAccent: row.titleAccent,
    highlight: row.highlight,
    description: row.description,
    image: row.image,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    secondaryLabel: row.secondaryLabel,
    secondaryHref: row.secondaryHref,
    theme: row.theme,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const testimonialSelect = {
  id: true,
  quote: true,
  authorName: true,
  location: true,
  rating: true,
  avatar: true,
  sortOrder: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.TestimonialSelect;

export type TestimonialRow = Prisma.TestimonialGetPayload<{ select: typeof testimonialSelect }>;

export function toTestimonialData(row: TestimonialRow): TestimonialData {
  return {
    id: row.id,
    quote: row.quote,
    authorName: row.authorName,
    location: row.location,
    rating: row.rating,
    avatar: row.avatar,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const siteContentItemSelect = {
  id: true,
  kind: true,
  group: true,
  title: true,
  subtitle: true,
  href: true,
  icon: true,
  sortOrder: true,
  isActive: true,
  updatedAt: true,
} satisfies Prisma.SiteContentItemSelect;

export type SiteContentItemRow = Prisma.SiteContentItemGetPayload<{
  select: typeof siteContentItemSelect;
}>;

export function toSiteContentItemData(row: SiteContentItemRow): SiteContentItemData {
  return {
    id: row.id,
    kind: row.kind,
    group: row.group,
    title: row.title ?? "",
    subtitle: row.subtitle,
    href: row.href,
    icon: row.icon,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Footer links -> columns. Columns appear in the order their heading is first seen (after sorting
 * links by sortOrder), so an admin orders columns by giving the first link of each the lowest
 * sortOrder. Links without a heading are skipped: a footer link must belong to a column.
 */
export function groupFooterLinks(links: readonly SiteContentItemData[]): FooterColumnData[] {
  const sorted = [...links].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title),
  );
  const columns = new Map<string, FooterColumnData>();
  for (const link of sorted) {
    const heading = link.group?.trim();
    if (!heading) continue;
    const column = columns.get(heading) ?? { heading, links: [] };
    column.links.push(link);
    columns.set(heading, column);
  }
  return [...columns.values()];
}
