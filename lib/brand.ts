/**
 * Store identity and static site copy: name, tagline, contact details, social links and the
 * marketing strings the storefront shell repeats (announcement bar, trust badges, footer).
 *
 * Pure data, no imports - safe for Server Components, Client Components, tests and the SEO
 * helpers. Change the values here and the whole shell follows.
 */

export const BRAND = {
  name: "Laxmi Plastic Stores",
  /** First word is rendered in the brand red, the rest in the brand blue. */
  nameAccent: "Laxmi",
  nameRest: "Plastic Stores",
  tagline: "Kitchenware & Household Products",
  description:
    "Your trusted partner for quality kitchenware and household products for over 26 years.",
  yearsInBusiness: 26,
  /** Orders at or above this amount ship free (Rs.). Display copy only; shipping is free today. */
  freeDeliveryThreshold: 2000,
  currency: "NPR",
  locale: "en-US",
} as const;

export const CONTACT = {
  phone: "+977-1-5912345",
  phoneHref: "tel:+97715912345",
  email: "hello@laxmiplasticstores.com",
  addressLine: "Bafal, Kathmandu",
  city: "Kathmandu",
  hours: "9:00 AM - 8:00 PM (Everyday)",
  directionsUrl: "https://maps.google.com/?q=Bafal,+Kathmandu",
} as const;

export type SocialLink = { name: "Facebook" | "Instagram" | "YouTube" | "TikTok"; href: string };

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { name: "Facebook", href: "https://facebook.com" },
  { name: "Instagram", href: "https://instagram.com" },
  { name: "YouTube", href: "https://youtube.com" },
  { name: "TikTok", href: "https://tiktok.com" },
];

/** Cities offered by the delivery-location picker in the header. */
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

export type AnnouncementIcon = "truck" | "shield" | "cash";

export const ANNOUNCEMENTS: readonly { icon: AnnouncementIcon; text: string }[] = [
  { icon: "truck", text: "Free Delivery on Orders Above Rs. 2,000" },
  { icon: "shield", text: `${BRAND.yearsInBusiness}+ Years of Trusted Service` },
  { icon: "cash", text: "Cash on Delivery Available" },
];

export type TrustBadgeIcon = "years" | "selection" | "quality" | "secure" | "delivery";

export const TRUST_BADGES: readonly { icon: TrustBadgeIcon; title: string; subtitle: string }[] = [
  { icon: "years", title: `${BRAND.yearsInBusiness}+ Years`, subtitle: "of Experience" },
  { icon: "selection", title: "Wide Product", subtitle: "Selection" },
  { icon: "quality", title: "Quality", subtitle: "Products" },
  { icon: "secure", title: "Secure", subtitle: "Shopping" },
  { icon: "delivery", title: "Reliable", subtitle: "Delivery" },
];

export type Testimonial = {
  quote: string;
  name: string;
  location: string;
  rating: number;
  /** Placeholder portrait. */
  avatar: string;
};

export const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "Excellent quality products and very reasonable prices. I have been shopping here for years and now I'm happy to see them online!",
    name: "Sita Sharma",
    location: "Kathmandu",
    rating: 5,
    avatar: "https://i.pravatar.cc/160?img=47",
  },
  {
    quote:
      "Ordered a pressure cooker and a thali set with cash on delivery. Everything arrived the next day, well packed.",
    name: "Ramesh Thapa",
    location: "Lalitpur",
    rating: 5,
    avatar: "https://i.pravatar.cc/160?img=12",
  },
  {
    quote:
      "The stainless steel range is genuinely heavy-gauge, not the thin stuff you get elsewhere. Worth every rupee.",
    name: "Anita Gurung",
    location: "Pokhara",
    rating: 4,
    avatar: "https://i.pravatar.cc/160?img=32",
  },
];

/** Placeholder portraits for the "happy customers" avatar stack; the figures come from real reviews. */
export const HAPPY_CUSTOMER_AVATARS = [
  "https://i.pravatar.cc/80?img=5",
  "https://i.pravatar.cc/80?img=15",
  "https://i.pravatar.cc/80?img=25",
  "https://i.pravatar.cc/80?img=36",
] as const;

const stock = (id: string) => `https://images.unsplash.com/photo-${id}?w=1600&q=80`;

export type HeroSlide = {
  badge: string;
  titleTop: string;
  titleAccent: string;
  text: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
};

export const HERO_SLIDES: readonly HeroSlide[] = [
  {
    badge: "Premium Quality",
    titleTop: "Everything Your",
    titleAccent: "Kitchen Needs",
    text: "Premium kitchenware, cookware & household essentials - all in one place.",
    primary: { label: "Shop Now", href: "/shop" },
    secondary: { label: "Explore Categories", href: "/shop" },
    image: stock("1556909114-f6e7ad7d3136"),
  },
  {
    badge: "Cookware Collection",
    titleTop: "Cook Like",
    titleAccent: "A Pro",
    text: "Pressure cookers, kadhai and non-stick pans built for the Nepali kitchen.",
    primary: { label: "Shop Cookware", href: "/shop?category=cookware" },
    secondary: { label: "See Offers", href: "/shop?onSale=true" },
    image: stock("1556910103-1c02745aae4d"),
  },
  {
    badge: "Cash on Delivery",
    titleTop: "Order Today,",
    titleAccent: "Pay at Your Door",
    text: "Free delivery on orders above Rs. 2,000 across the Kathmandu valley.",
    primary: { label: "Start Shopping", href: "/shop" },
    secondary: { label: "How It Works", href: "/shipping" },
    image: stock("1600607687939-ce8a6c25118c"),
  },
];

export type PromoBanner = {
  eyebrow: string;
  title: string;
  highlight?: string;
  cta: { label: string; href: string };
  /** Tailwind gradient classes for the tile background. */
  gradient: string;
  /** Button style: white pill, outlined, or brand blue. */
  button: "white" | "outline" | "blue";
  image: string;
  /** Only the festival tile shows on phones, as in the reference design. */
  mobile?: boolean;
};

export const PROMO_BANNERS: readonly PromoBanner[] = [
  {
    eyebrow: "Cookware Collection",
    title: "Upgrade Your Kitchen",
    cta: { label: "Shop Cookware", href: "/shop?category=cookware" },
    gradient: "from-[#8f1d18] via-[#c22a24] to-[#e35a3a]",
    button: "white",
    image: stock("1556911220-bff31c812dba"),
  },
  {
    eyebrow: "Stainless Steel Collection",
    title: "Built for Everyday Life",
    cta: { label: "Explore Collection", href: "/shop?category=stainless-steel" },
    gradient: "from-[#0b5f5a] via-[#0f766e] to-[#2aa79b]",
    button: "outline",
    image: stock("1565538810643-b5bdb714032a"),
  },
  {
    eyebrow: "Festival Offers",
    title: "Dashain Kitchen Mega Sale",
    highlight: "Up to 40% OFF",
    cta: { label: "Shop Now", href: "/shop?onSale=true" },
    gradient: "from-[#f26a1f] via-[#e8412c] to-[#c81e1e]",
    button: "blue",
    image: stock("1600566753086-00f18fb6b3ea"),
    mobile: true,
  },
];

export type FooterLink = { label: string; href: string };

export const FOOTER_COLUMNS: readonly { heading: string; links: readonly FooterLink[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All Products", href: "/shop" },
      { label: "New Arrivals", href: "/shop?sort=newest" },
      { label: "Best Sellers", href: "/shop?featured=true" },
      { label: "Offers", href: "/shop?onSale=true" },
    ],
  },
  {
    heading: "Categories",
    links: [
      { label: "Kitchenware", href: "/shop?category=kitchenware" },
      { label: "Cookware", href: "/shop?category=cookware" },
      { label: "Stainless Steel", href: "/shop?category=stainless-steel" },
      { label: "Glass & Ceramic", href: "/shop?category=glass-ceramic" },
      { label: "Gas & Stove", href: "/shop?category=gas-stove" },
    ],
  },
  {
    heading: "Customer Service",
    links: [
      { label: "Contact Us", href: "/contact" },
      { label: "Shipping Information", href: "/shipping" },
      { label: "Returns & Refunds", href: "/returns" },
      { label: "FAQs", href: "/faq" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
  {
    heading: "Store",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Story", href: "/about#story" },
      { label: "Store Location", href: CONTACT.directionsUrl },
    ],
  },
];
