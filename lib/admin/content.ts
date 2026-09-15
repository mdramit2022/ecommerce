import type { BannerPlacement, Prisma, SiteContentKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bannerSelect,
  siteContentItemSelect,
  testimonialSelect,
  toBannerData,
  toSiteContentItemData,
  toTestimonialData,
} from "@/lib/content/serialize";
import { settingsFromRows, settingsToRows } from "@/lib/content/settings";
import type { SiteSettings } from "@/lib/content/kinds";
import type {
  BannerInput,
  SiteContentItemInput,
  SiteSettingsInput,
  TestimonialInput,
} from "@/lib/validations/content";
import type { BannerData, SiteContentItemData, TestimonialData } from "@/types/content";

/**
 * Admin data access for storefront content (banners, testimonials, content items, settings).
 * Server only. Returns serialisable shapes; Server Actions in app/admin/** call these and handle
 * revalidation and redirects.
 */

const byOrder = [
  { sortOrder: "asc" },
  { createdAt: "asc" },
] satisfies Prisma.BannerOrderByWithRelationInput[];

// ───────────────────────────── Banners ─────────────────────────────

export async function listBanners(placement?: BannerPlacement): Promise<BannerData[]> {
  const rows = await prisma.banner.findMany({
    where: placement ? { placement } : undefined,
    select: bannerSelect,
    orderBy: [{ placement: "asc" }, ...byOrder],
  });
  return rows.map(toBannerData);
}

export async function getBanner(id: string): Promise<BannerData | null> {
  const row = await prisma.banner.findUnique({ where: { id }, select: bannerSelect });
  return row ? toBannerData(row) : null;
}

function bannerData(input: BannerInput): Prisma.BannerUncheckedCreateInput {
  return {
    placement: input.placement,
    eyebrow: input.eyebrow ?? null,
    title: input.title,
    titleAccent: input.titleAccent ?? null,
    highlight: input.highlight ?? null,
    description: input.description ?? null,
    image: input.image,
    ctaLabel: input.ctaLabel ?? null,
    ctaHref: input.ctaHref ?? null,
    secondaryLabel: input.secondaryLabel ?? null,
    secondaryHref: input.secondaryHref ?? null,
    theme: input.theme ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}

export async function createBanner(input: BannerInput): Promise<BannerData> {
  const row = await prisma.banner.create({ data: bannerData(input), select: bannerSelect });
  return toBannerData(row);
}

export async function updateBanner(id: string, input: BannerInput): Promise<BannerData> {
  const row = await prisma.banner.update({
    where: { id },
    data: bannerData(input),
    select: bannerSelect,
  });
  return toBannerData(row);
}

export async function setBannerActive(id: string, isActive: boolean): Promise<BannerData> {
  const row = await prisma.banner.update({
    where: { id },
    data: { isActive },
    select: bannerSelect,
  });
  return toBannerData(row);
}

export async function deleteBanner(id: string): Promise<BannerData> {
  const row = await prisma.banner.delete({ where: { id }, select: bannerSelect });
  return toBannerData(row);
}

// ───────────────────────────── Testimonials ─────────────────────────────

export async function listTestimonials(): Promise<TestimonialData[]> {
  const rows = await prisma.testimonial.findMany({ select: testimonialSelect, orderBy: byOrder });
  return rows.map(toTestimonialData);
}

export async function getTestimonial(id: string): Promise<TestimonialData | null> {
  const row = await prisma.testimonial.findUnique({ where: { id }, select: testimonialSelect });
  return row ? toTestimonialData(row) : null;
}

function testimonialData(input: TestimonialInput): Prisma.TestimonialUncheckedCreateInput {
  return {
    quote: input.quote,
    authorName: input.authorName,
    location: input.location ?? null,
    rating: input.rating,
    avatar: input.avatar ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}

export async function createTestimonial(input: TestimonialInput): Promise<TestimonialData> {
  const row = await prisma.testimonial.create({
    data: testimonialData(input),
    select: testimonialSelect,
  });
  return toTestimonialData(row);
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput,
): Promise<TestimonialData> {
  const row = await prisma.testimonial.update({
    where: { id },
    data: testimonialData(input),
    select: testimonialSelect,
  });
  return toTestimonialData(row);
}

export async function setTestimonialActive(
  id: string,
  isActive: boolean,
): Promise<TestimonialData> {
  const row = await prisma.testimonial.update({
    where: { id },
    data: { isActive },
    select: testimonialSelect,
  });
  return toTestimonialData(row);
}

export async function deleteTestimonial(id: string): Promise<TestimonialData> {
  const row = await prisma.testimonial.delete({ where: { id }, select: testimonialSelect });
  return toTestimonialData(row);
}

// ───────────────────────────── Content items ─────────────────────────────

export async function listContentItems(kind?: SiteContentKind): Promise<SiteContentItemData[]> {
  const rows = await prisma.siteContentItem.findMany({
    where: kind ? { kind } : undefined,
    select: siteContentItemSelect,
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(toSiteContentItemData);
}

function contentItemData(input: SiteContentItemInput): Prisma.SiteContentItemUncheckedCreateInput {
  return {
    kind: input.kind,
    group: input.group ?? null,
    title: input.title ?? null,
    subtitle: input.subtitle ?? null,
    href: input.href ?? null,
    icon: input.icon ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
}

/** Create when `id` is null, otherwise update. */
export async function saveContentItem(
  id: string | null,
  input: SiteContentItemInput,
): Promise<SiteContentItemData> {
  const row = id
    ? await prisma.siteContentItem.update({
        where: { id },
        data: contentItemData(input),
        select: siteContentItemSelect,
      })
    : await prisma.siteContentItem.create({
        data: contentItemData(input),
        select: siteContentItemSelect,
      });
  return toSiteContentItemData(row);
}

export async function setContentItemActive(
  id: string,
  isActive: boolean,
): Promise<SiteContentItemData> {
  const row = await prisma.siteContentItem.update({
    where: { id },
    data: { isActive },
    select: siteContentItemSelect,
  });
  return toSiteContentItemData(row);
}

export async function deleteContentItem(id: string): Promise<SiteContentItemData> {
  const row = await prisma.siteContentItem.delete({ where: { id }, select: siteContentItemSelect });
  return toSiteContentItemData(row);
}

// ───────────────────────────── Settings ─────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
  return settingsFromRows(rows);
}

/** Upsert every setting row in one transaction. */
export async function saveSiteSettings(input: SiteSettingsInput): Promise<SiteSettings> {
  const rows = settingsToRows(input);
  await prisma.$transaction(
    rows.map((row) =>
      prisma.siteSetting.upsert({
        where: { key: row.key },
        update: { value: row.value },
        create: { key: row.key, value: row.value },
      }),
    ),
  );
  return input;
}
