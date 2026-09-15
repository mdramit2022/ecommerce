import type { BannerPlacement } from "@prisma/client";
import type {
  BannerTheme,
  ContentIconKey,
  SiteSettings,
  SocialNetworkKey,
} from "@/lib/content/kinds";

/**
 * Store identity plus the DEFAULT storefront content.
 *
 * The identity (`BRAND`) is code: name, wordmark split, tagline, currency. Everything else on this
 * page is a default that `prisma/seed.ts` writes into the database ONCE (only when the table for
 * that kind is empty) and that the storefront falls back to when a setting row is missing. After
 * seeding, admins edit the live content under /admin/banners, /admin/testimonials,
 * /admin/content and /admin/settings - not here.
 *
 * Pure data, no imports beyond types - safe for Server Components, Client Components and tests.
 */

export const BRAND = {
  name: "Laxmi Plastic Stores",
  /** First word is rendered in the brand red, the rest in the brand blue. */
  nameAccent: "Laxmi",
  nameRest: "Plastic Stores",
  tagline: "Kitchenware & Household Products",
  description:
    "Your trusted partner for quality kitchenware and household products for over 26 years.",
  currency: "NPR",
  locale: "en-US",
} as const;

/** Fallbacks for `SiteSetting` rows (see lib/content/settings.ts). */
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  phone: "+977-1-5912345",
  email: "hello@laxmiplasticstores.com",
  addressLine: "Bafal, Kathmandu",
  hours: "9:00 AM - 8:00 PM (Everyday)",
  directionsUrl: "https://maps.google.com/?q=Bafal,+Kathmandu",
  freeDeliveryThreshold: 2000,
  yearsInBusiness: 26,
  newsletterBlurb: "Get updates about new products and exclusive offers.",
};

/** Cities offered by the (currently hidden) delivery-location picker in the header. */
export const DELIVERY_CITIES = [
  "Kathmandu",
  "Lalitpur",
  "Bhaktapur",
  "Pokhara",
  "Chitwan",
  "Biratnagar",
  "Butwal",
] as const;
export type DeliveryCity = (typeof DELIVERY_CITIES)[number];
export const DEFAULT_DELIVERY_CITY: DeliveryCity = "Kathmandu";

/** Placeholder portraits for the "happy customers" avatar stack; the figures come from real reviews. */
export const HAPPY_CUSTOMER_AVATARS = [
  "https://i.pravatar.cc/80?img=5",
  "https://i.pravatar.cc/80?img=15",
  "https://i.pravatar.cc/80?img=25",
  "https://i.pravatar.cc/80?img=36",
] as const;

// ───────────────────────────── Seed defaults ─────────────────────────────

const stock = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80`;

export type ContentItemSeed = {
  group?: string;
  title?: string;
  subtitle?: string;
  href?: string;
  icon?: ContentIconKey | SocialNetworkKey;
};

export const DEFAULT_ANNOUNCEMENTS: readonly ContentItemSeed[] = [
  { icon: "truck", title: "Free Delivery on Orders Above Rs. 2,000" },
  { icon: "shield", title: "26+ Years of Trusted Service" },
  { icon: "cash", title: "Cash on Delivery Available", href: "/checkout" },
];

export const DEFAULT_TRUST_BADGES: readonly ContentItemSeed[] = [
  { icon: "award", title: "26+ Years", subtitle: "of Experience" },
  { icon: "package", title: "Wide Product", subtitle: "Selection" },
  { icon: "badge-check", title: "Quality", subtitle: "Products" },
  { icon: "lock", title: "Secure", subtitle: "Shopping" },
  { icon: "truck", title: "Reliable", subtitle: "Delivery" },
];

export const DEFAULT_SOCIAL_LINKS: readonly ContentItemSeed[] = [
  { icon: "facebook", title: "Facebook", href: "https://facebook.com" },
  { icon: "instagram", title: "Instagram", href: "https://instagram.com" },
  { icon: "youtube", title: "YouTube", href: "https://youtube.com" },
  { icon: "tiktok", title: "TikTok", href: "https://tiktok.com" },
];

export const DEFAULT_FOOTER_LINKS: readonly ContentItemSeed[] = [
  { group: "Shop", title: "All Products", href: "/shop" },
  { group: "Shop", title: "New Arrivals", href: "/shop?sort=newest" },
  { group: "Shop", title: "Best Sellers", href: "/shop?featured=true" },
  { group: "Shop", title: "Offers", href: "/shop?onSale=true" },
  { group: "Categories", title: "Kitchenware", href: "/shop?category=kitchenware" },
  { group: "Categories", title: "Cookware", href: "/shop?category=cookware" },
  { group: "Categories", title: "Stainless Steel", href: "/shop?category=stainless-steel" },
  { group: "Categories", title: "Glass & Ceramic", href: "/shop?category=glass-ceramic" },
  { group: "Categories", title: "Gas & Stove", href: "/shop?category=gas-stove" },
  { group: "Customer Service", title: "Contact Us", href: "/contact" },
  { group: "Customer Service", title: "Shipping Information", href: "/shipping" },
  { group: "Customer Service", title: "Returns & Refunds", href: "/returns" },
  { group: "Customer Service", title: "FAQs", href: "/faq" },
  { group: "Customer Service", title: "Privacy Policy", href: "/privacy" },
  { group: "Customer Service", title: "Terms & Conditions", href: "/terms" },
  { group: "Store", title: "About Us", href: "/about" },
  { group: "Store", title: "Our Story", href: "/about#story" },
  { group: "Store", title: "Store Location", href: DEFAULT_SITE_SETTINGS.directionsUrl },
];

export type BannerSeed = {
  placement: BannerPlacement;
  eyebrow?: string;
  title: string;
  titleAccent?: string;
  highlight?: string;
  description?: string;
  image: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  theme?: BannerTheme;
};

export const DEFAULT_BANNERS: readonly BannerSeed[] = [
  {
    placement: "HERO",
    eyebrow: "Premium Quality",
    title: "Everything Your",
    titleAccent: "Kitchen Needs",
    description: "Premium kitchenware, cookware & household essentials - all in one place.",
    image: stock("1556909114-f6e7ad7d3136"),
    ctaLabel: "Shop Now",
    ctaHref: "/shop",
    secondaryLabel: "Explore Categories",
    secondaryHref: "/shop",
  },
  {
    placement: "HERO",
    eyebrow: "Cookware Collection",
    title: "Cook Like",
    titleAccent: "A Pro",
    description: "Pressure cookers, kadhai and non-stick pans built for the Nepali kitchen.",
    image: stock("1556910103-1c02745aae4d"),
    ctaLabel: "Shop Cookware",
    ctaHref: "/shop?category=cookware",
    secondaryLabel: "See Offers",
    secondaryHref: "/shop?onSale=true",
  },
  {
    placement: "HERO",
    eyebrow: "Cash on Delivery",
    title: "Order Today,",
    titleAccent: "Pay at Your Door",
    description: "Free delivery on orders above Rs. 2,000 across the Kathmandu valley.",
    image: stock("1600607687939-ce8a6c25118c"),
    ctaLabel: "Start Shopping",
    ctaHref: "/shop",
    secondaryLabel: "How It Works",
    secondaryHref: "/shipping",
  },
  {
    placement: "PROMO_TILE",
    eyebrow: "Cookware Collection",
    title: "Upgrade Your Kitchen",
    image: stock("1556911220-bff31c812dba"),
    ctaLabel: "Shop Cookware",
    ctaHref: "/shop?category=cookware",
    theme: "red",
  },
  {
    placement: "PROMO_TILE",
    eyebrow: "Stainless Steel Collection",
    title: "Built for Everyday Life",
    image: stock("1565538810643-b5bdb714032a"),
    ctaLabel: "Explore Collection",
    ctaHref: "/shop?category=stainless-steel",
    theme: "teal",
  },
  {
    placement: "PROMO_TILE",
    eyebrow: "Festival Offers",
    title: "Dashain Kitchen Mega Sale",
    highlight: "Up to 40% OFF",
    image: stock("1600566753086-00f18fb6b3ea"),
    ctaLabel: "Shop Now",
    ctaHref: "/shop?onSale=true",
    theme: "orange",
  },
  {
    placement: "SIDEBAR",
    eyebrow: "This Week Only",
    title: "Pressure Cookers",
    highlight: "From Rs. 3,250",
    description: "Prestige, Hawkins and more - induction and gas ready.",
    image: stock("1585515320310-259814833e62"),
    ctaLabel: "Shop Cookware",
    ctaHref: "/shop?category=cookware",
    theme: "navy",
  },
];

export type TestimonialSeed = {
  quote: string;
  authorName: string;
  location: string;
  rating: number;
  avatar: string;
};

export const DEFAULT_TESTIMONIALS: readonly TestimonialSeed[] = [
  {
    quote:
      "Excellent quality products and very reasonable prices. I have been shopping here for years and now I'm happy to see them online!",
    authorName: "Sita Sharma",
    location: "Kathmandu",
    rating: 5,
    avatar: "https://i.pravatar.cc/160?img=47",
  },
  {
    quote:
      "Ordered a pressure cooker and a thali set with cash on delivery. Everything arrived the next day, well packed.",
    authorName: "Ramesh Thapa",
    location: "Lalitpur",
    rating: 5,
    avatar: "https://i.pravatar.cc/160?img=12",
  },
  {
    quote:
      "The stainless steel range is genuinely heavy-gauge, not the thin stuff you get elsewhere. Worth every rupee.",
    authorName: "Anita Gurung",
    location: "Pokhara",
    rating: 4,
    avatar: "https://i.pravatar.cc/160?img=32",
  },
];
