import { z } from "zod";
import {
  BANNER_PLACEMENTS,
  BANNER_THEMES,
  CONTENT_ICON_KEYS,
  SITE_CONTENT_KINDS,
  SOCIAL_NETWORK_KEYS,
} from "@/lib/content/kinds";
import { productImageSchema } from "@/lib/validations/product";

/**
 * Schemas for the admin-managed storefront content: banners, testimonials, small content items
 * (announcements, trust badges, social links, footer links) and store settings.
 * Used by the admin Server Actions; the storefront only reads.
 */

/** Blank form fields become null so optional columns are cleared rather than stored as "". */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable().optional(),
  );

/**
 * A link target the storefront may render: a site path (`/shop?onSale=true`, never `//host`),
 * an http(s) URL, or a tel:/mailto: link.
 */
export const linkHrefSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      /^https?:\/\/[^\s]+$/i.test(value) ||
      /^(tel|mailto):[^\s]+$/i.test(value),
    { message: "Use a site path like /shop, an https:// URL, or a tel:/mailto: link" },
  );

const optionalHref = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? null : value),
  linkHrefSchema.nullable().optional(),
);

const sortOrderSchema = z.coerce.number().int().min(0).max(9999).default(0);

export const bannerPlacementSchema = z.enum(BANNER_PLACEMENTS);
export const bannerThemeSchema = z.enum(BANNER_THEMES);

/** Body accepted by the banner create/edit forms. */
export const bannerSchema = z
  .object({
    placement: bannerPlacementSchema,
    eyebrow: optionalText(60),
    title: z.string().trim().min(1, "Title is required").max(120),
    titleAccent: optionalText(80),
    highlight: optionalText(60),
    description: optionalText(300),
    image: productImageSchema,
    ctaLabel: optionalText(40),
    ctaHref: optionalHref,
    secondaryLabel: optionalText(40),
    secondaryHref: optionalHref,
    theme: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      bannerThemeSchema.nullable().optional(),
    ),
    sortOrder: sortOrderSchema,
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (Boolean(data.ctaLabel) !== Boolean(data.ctaHref)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.ctaLabel ? "ctaHref" : "ctaLabel"],
        message: "A button needs both a label and a link",
      });
    }
    if (Boolean(data.secondaryLabel) !== Boolean(data.secondaryHref)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [data.secondaryLabel ? "secondaryHref" : "secondaryLabel"],
        message: "A button needs both a label and a link",
      });
    }
  });
export type BannerInput = z.infer<typeof bannerSchema>;

/** Body accepted by the testimonial create/edit forms. */
export const testimonialSchema = z.object({
  quote: z.string().trim().min(10, "Quote must be at least 10 characters").max(500),
  authorName: z.string().trim().min(2, "Name is required").max(80),
  location: optionalText(80),
  rating: z.coerce.number().int().min(1, "Rating is 1 to 5").max(5, "Rating is 1 to 5"),
  avatar: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    productImageSchema.nullable().optional(),
  ),
  sortOrder: sortOrderSchema,
  isActive: z.boolean().default(true),
});
export type TestimonialInput = z.infer<typeof testimonialSchema>;

export const siteContentKindSchema = z.enum(SITE_CONTENT_KINDS);

/**
 * Body accepted by the content list editors. One schema for all four kinds; the refinement
 * enforces what each kind needs (an icon for badges, a URL for links, a column for footer links).
 */
export const siteContentItemSchema = z
  .object({
    kind: siteContentKindSchema,
    group: optionalText(40),
    title: optionalText(120),
    subtitle: optionalText(120),
    href: optionalHref,
    icon: optionalText(40),
    sortOrder: sortOrderSchema,
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const need = (path: string, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
    const contentIcon = (CONTENT_ICON_KEYS as readonly string[]).includes(data.icon ?? "");
    const social = (SOCIAL_NETWORK_KEYS as readonly string[]).includes(data.icon ?? "");

    switch (data.kind) {
      case "ANNOUNCEMENT":
        if (!data.title) need("title", "Text is required");
        if (!contentIcon) need("icon", "Choose an icon");
        break;
      case "TRUST_BADGE":
        if (!data.title) need("title", "Title is required");
        if (!contentIcon) need("icon", "Choose an icon");
        break;
      case "SOCIAL_LINK":
        if (!social) need("icon", "Choose a network");
        if (!data.href) need("href", "Profile URL is required");
        break;
      case "FOOTER_LINK":
        if (!data.group) need("group", "Column heading is required");
        if (!data.title) need("title", "Label is required");
        if (!data.href) need("href", "Link is required");
        break;
    }
  });
export type SiteContentItemInput = z.infer<typeof siteContentItemSchema>;

/** Body accepted by the store settings form. */
export const siteSettingsSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^[+\d\s().-]{5,30}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email address").max(200),
  addressLine: z.string().trim().min(2, "Address is required").max(200),
  hours: z.string().trim().min(2, "Opening hours are required").max(120),
  directionsUrl: z.string().trim().url("Enter a full https:// link").max(2048),
  freeDeliveryThreshold: z.coerce.number().min(0).max(10_000_000),
  yearsInBusiness: z.coerce.number().int().min(0).max(200),
  newsletterBlurb: z.string().trim().max(200),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;
