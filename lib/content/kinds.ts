import type { BannerPlacement, SiteContentKind } from "@prisma/client";

/**
 * Vocabulary for the admin-managed storefront content: banner placements and colour themes,
 * the kinds of small content items (announcement bar lines, trust badges, social links, footer
 * links) and the icon keys they may use, plus the settings the store form edits.
 *
 * Pure data - no Prisma runtime, no env - so Client Components (admin forms), Server Components
 * and Zod schemas all share one source of truth.
 */

// ───────────────────────────── Banners ─────────────────────────────

export const BANNER_PLACEMENTS = [
  "HERO",
  "PROMO_TILE",
  "SIDEBAR",
] as const satisfies readonly BannerPlacement[];

export type BannerField =
  | "eyebrow"
  | "title"
  | "titleAccent"
  | "highlight"
  | "description"
  | "image"
  | "ctaLabel"
  | "ctaHref"
  | "secondaryLabel"
  | "secondaryHref"
  | "theme";

export const BANNER_PLACEMENT_META: Record<
  BannerPlacement,
  { label: string; plural: string; hint: string; fields: readonly BannerField[] }
> = {
  HERO: {
    label: "Hero slide",
    plural: "Hero slides",
    hint: "The full-width carousel at the top of the home page. Slides rotate in sort order.",
    fields: [
      "eyebrow",
      "title",
      "titleAccent",
      "description",
      "image",
      "ctaLabel",
      "ctaHref",
      "secondaryLabel",
      "secondaryHref",
    ],
  },
  PROMO_TILE: {
    label: "Promo tile",
    plural: "Promo tiles",
    hint: "Collection tiles between Best Sellers and New Arrivals. Three fit one desktop row; only the first shows on phones.",
    fields: ["eyebrow", "title", "highlight", "image", "ctaLabel", "ctaHref", "theme"],
  },
  SIDEBAR: {
    label: "Side banner",
    plural: "Side banners",
    hint: "The tall banner beside the hero on desktop. The first active one is shown.",
    fields: [
      "eyebrow",
      "title",
      "highlight",
      "description",
      "image",
      "ctaLabel",
      "ctaHref",
      "theme",
    ],
  },
};

export const BANNER_THEMES = ["red", "teal", "orange", "blue", "navy", "green"] as const;
export type BannerTheme = (typeof BANNER_THEMES)[number];

export type BannerButtonStyle = "white" | "outline" | "blue" | "orange";

export const BANNER_THEME_META: Record<
  BannerTheme,
  { label: string; gradient: string; button: BannerButtonStyle }
> = {
  red: { label: "Red", gradient: "from-[#8f1d18] via-[#c22a24] to-[#e35a3a]", button: "white" },
  teal: { label: "Teal", gradient: "from-[#0b5f5a] via-[#0f766e] to-[#2aa79b]", button: "outline" },
  orange: {
    label: "Festival orange",
    gradient: "from-[#f26a1f] via-[#e8412c] to-[#c81e1e]",
    button: "blue",
  },
  blue: { label: "Blue", gradient: "from-[#0b2a5b] via-[#1a5fd1] to-[#3b82f6]", button: "white" },
  navy: { label: "Navy", gradient: "from-[#081f44] via-[#0b2a5b] to-[#1c3f7a]", button: "orange" },
  green: { label: "Green", gradient: "from-[#14532d] via-[#15803d] to-[#22c55e]", button: "white" },
};

export const DEFAULT_BANNER_THEME: Record<BannerPlacement, BannerTheme> = {
  HERO: "blue",
  PROMO_TILE: "red",
  SIDEBAR: "navy",
};

export function isBannerTheme(value: string | null | undefined): value is BannerTheme {
  return (
    value !== null && value !== undefined && (BANNER_THEMES as readonly string[]).includes(value)
  );
}

export function bannerTheme(
  placement: BannerPlacement,
  value: string | null | undefined,
): BannerTheme {
  return isBannerTheme(value) ? value : DEFAULT_BANNER_THEME[placement];
}

// ───────────────────────────── Small content items ─────────────────────────────

export const SITE_CONTENT_KINDS = [
  "ANNOUNCEMENT",
  "TRUST_BADGE",
  "SOCIAL_LINK",
  "FOOTER_LINK",
] as const satisfies readonly SiteContentKind[];

export const CONTENT_ICON_KEYS = [
  "truck",
  "shield",
  "cash",
  "award",
  "package",
  "badge-check",
  "lock",
  "clock",
  "phone",
  "tag",
  "sparkles",
  "star",
  "map-pin",
  "mail",
] as const;
export type ContentIconKey = (typeof CONTENT_ICON_KEYS)[number];

export const CONTENT_ICON_LABELS: Record<ContentIconKey, string> = {
  truck: "Delivery truck",
  shield: "Shield",
  cash: "Banknote",
  award: "Award ribbon",
  package: "Package",
  "badge-check": "Quality check",
  lock: "Padlock",
  clock: "Clock",
  phone: "Phone",
  tag: "Price tag",
  sparkles: "Sparkles",
  star: "Star",
  "map-pin": "Map pin",
  mail: "Envelope",
};

export const SOCIAL_NETWORK_KEYS = ["facebook", "instagram", "youtube", "tiktok"] as const;
export type SocialNetworkKey = (typeof SOCIAL_NETWORK_KEYS)[number];

export const SOCIAL_NETWORK_LABELS: Record<SocialNetworkKey, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function isContentIconKey(value: string | null | undefined): value is ContentIconKey {
  return (
    value !== null &&
    value !== undefined &&
    (CONTENT_ICON_KEYS as readonly string[]).includes(value)
  );
}

export function isSocialNetworkKey(value: string | null | undefined): value is SocialNetworkKey {
  return (
    value !== null &&
    value !== undefined &&
    (SOCIAL_NETWORK_KEYS as readonly string[]).includes(value)
  );
}

export type ContentField = "group" | "title" | "subtitle" | "href" | "icon";

export const SITE_CONTENT_KIND_META: Record<
  SiteContentKind,
  {
    label: string;
    plural: string;
    hint: string;
    fields: readonly ContentField[];
    labels: Partial<Record<ContentField, string>>;
  }
> = {
  ANNOUNCEMENT: {
    label: "Announcement",
    plural: "Announcement bar",
    hint: "Short promises in the navy strip above the header (desktop). Keep each under 45 characters.",
    fields: ["icon", "title", "href"],
    labels: { title: "Text", href: "Link (optional)", icon: "Icon" },
  },
  TRUST_BADGE: {
    label: "Trust badge",
    plural: "Trust badges",
    hint: "The row of reasons to buy near the bottom of the home page. Five fit one desktop row.",
    fields: ["icon", "title", "subtitle"],
    labels: { title: "Title", subtitle: "Subtitle", icon: "Icon" },
  },
  SOCIAL_LINK: {
    label: "Social link",
    plural: "Social links",
    hint: "Icons in the announcement bar and the footer.",
    fields: ["icon", "href"],
    labels: { icon: "Network", href: "Profile URL" },
  },
  FOOTER_LINK: {
    label: "Footer link",
    plural: "Footer links",
    hint: "Grouped into columns by heading. Use site paths like /shop or full https URLs.",
    fields: ["group", "title", "href"],
    labels: { group: "Column heading", title: "Label", href: "Link" },
  },
};

// ───────────────────────────── Store settings ─────────────────────────────

export type SiteSettings = {
  phone: string;
  email: string;
  addressLine: string;
  hours: string;
  directionsUrl: string;
  freeDeliveryThreshold: number;
  yearsInBusiness: number;
  newsletterBlurb: string;
};

export type SiteSettingField = {
  key: string;
  prop: keyof SiteSettings;
  label: string;
  type: "text" | "tel" | "email" | "url" | "number";
  hint?: string;
};

/** The `SiteSetting` rows the store form edits: `key` is the row id, `prop` the typed property. */
export const SITE_SETTING_FIELDS: readonly SiteSettingField[] = [
  {
    key: "contact.phone",
    prop: "phone",
    label: "Phone number",
    type: "tel",
    hint: "Shown in the phone drawer, the store card and the footer",
  },
  { key: "contact.email", prop: "email", label: "Support email", type: "email" },
  { key: "contact.addressLine", prop: "addressLine", label: "Store address", type: "text" },
  { key: "contact.hours", prop: "hours", label: "Opening hours", type: "text" },
  { key: "contact.directionsUrl", prop: "directionsUrl", label: "Directions link", type: "url" },
  {
    key: "store.freeDeliveryThreshold",
    prop: "freeDeliveryThreshold",
    label: "Free delivery from (Rs.)",
    type: "number",
    hint: "Display copy only - shipping is free today",
  },
  {
    key: "store.yearsInBusiness",
    prop: "yearsInBusiness",
    label: "Years in business",
    type: "number",
    hint: "Drives the gold medallion on the hero",
  },
  {
    key: "newsletter.blurb",
    prop: "newsletterBlurb",
    label: "Newsletter text",
    type: "text",
    hint: "Line above the subscribe box in the footer",
  },
];
