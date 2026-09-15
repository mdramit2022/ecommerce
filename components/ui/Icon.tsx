import type { SVGProps } from "react";

/**
 * Inline icon set for the storefront shell. Stroke icons on a 24x24 grid, coloured by
 * `currentColor` and sized by className - no icon dependency needed. Server and Client safe.
 */

export type IconProps = SVGProps<SVGSVGElement>;

function Stroke({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Fill({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

// ───────────────────────────── Navigation & actions ─────────────────────────────

export const MenuIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Stroke>
);

export const XIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Stroke>
);

export const SearchIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Stroke>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m6 9 6 6 6-6" />
  </Stroke>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m9 6 6 6-6 6" />
  </Stroke>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m15 6-6 6 6 6" />
  </Stroke>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Stroke>
);

export const CheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m5 12 5 5L20 7" />
  </Stroke>
);

export const MapPinIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Stroke>
);

export const UserIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Stroke>
);

export const HeartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 20.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10Z" />
  </Stroke>
);

export const HeartFilledIcon = (p: IconProps) => (
  <Fill {...p}>
    <path d="M12 21.2 3.3 12.9A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 8.7 6.3L12 21.2Z" />
  </Fill>
);

export const ShoppingCartIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.2L21 8H6.2" />
    <circle cx="9.5" cy="20" r="1.3" />
    <circle cx="17" cy="20" r="1.3" />
  </Stroke>
);

export const HomeIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5.5 10.5V20h13v-9.5" />
    <path d="M10 20v-5h4v5" />
  </Stroke>
);

export const GridIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" />
  </Stroke>
);

export const PhoneIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Stroke>
);

export const ClockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Stroke>
);

export const MailIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Stroke>
);

export const NavigationIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m3 11 18-8-8 18-2-8-8-2Z" />
  </Stroke>
);

// ───────────────────────────── Marketing / trust ─────────────────────────────

export const TruckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="17" cy="18" r="1.8" />
  </Stroke>
);

export const ShieldCheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8 7.5 9.5 4.3-1.5 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </Stroke>
);

export const BanknoteIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6.5 9.5h.01M17.5 14.5h.01" />
  </Stroke>
);

export const PackageIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </Stroke>
);

export const BadgeCheckIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 2.5 2.4 1.9 3-.4 1.1 2.8 2.7 1.4-.6 3 1.9 2.4-1.9 2.4.6 3-2.7 1.4-1.1 2.8-3-.4L12 21.5l-2.4-1.9-3 .4-1.1-2.8-2.7-1.4.6-3L1.5 12l1.9-2.4-.6-3 2.7-1.4L6.6 4l3 .4L12 2.5Z" />
    <path d="m8.5 12 2.3 2.3L15.5 9.5" />
  </Stroke>
);

export const LockIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Stroke>
);

export const AwardIcon = (p: IconProps) => (
  <Stroke {...p}>
    <circle cx="12" cy="9" r="5.5" />
    <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
  </Stroke>
);

export const FlameIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3.5.5 1 1.2 1.6 2 2C10.5 8 10.8 5.5 12 3Z" />
  </Stroke>
);

export const SparklesIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 3 1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" />
    <path d="M19 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2ZM5 15l.6 1.5 1.5.6-1.5.6L5 19.2l-.6-1.5-1.5-.6 1.5-.6L5 15Z" />
  </Stroke>
);

export const TagIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M3 12.5V4h8.5l9 9-8.5 8.5-9-9Z" />
    <circle cx="7.5" cy="8.5" r="1.3" />
  </Stroke>
);

export const StarOutlineIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />
  </Stroke>
);

export const QuoteIcon = (p: IconProps) => (
  <Fill {...p}>
    <path d="M7.5 6C5 6 3 8 3 10.5V18h7v-7H6.5c0-1.7 1.3-3 3-3V6h-2Zm10 0C15 6 13 8 13 10.5V18h7v-7h-3.5c0-1.7 1.3-3 3-3V6h-2Z" />
  </Fill>
);

// ───────────────────────────── Category glyphs ─────────────────────────────

export const PotIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M5 10h14v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6Z" />
    <path d="M2.5 11H5M19 11h2.5M8 10V8a4 4 0 0 1 8 0v2M10 5.5V4M14 5.5V4" />
  </Stroke>
);

export const UtensilsIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18" />
    <path d="M17 3c-1.7 1.5-2.5 3.5-2.5 6.5 0 1.5.8 2.5 2.5 2.5V21" />
  </Stroke>
);

export const BottleIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9.5 3h5v3.5l1.5 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-5A1.5 1.5 0 0 1 8 20V9l1.5-2.5V3Z" />
    <path d="M8 13h8" />
  </Stroke>
);

export const LayersIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
  </Stroke>
);

export const CupIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 8h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z" />
    <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2M6 4.5c0 1 1 1 1 2M10 4.5c0 1 1 1 1 2" />
  </Stroke>
);

export const StoveIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3" y="9" width="18" height="11" rx="2" />
    <circle cx="8.5" cy="14.5" r="2.5" />
    <circle cx="15.5" cy="14.5" r="2.5" />
    <path d="M7 9V6.5M12 9V5M17 9V6.5" />
  </Stroke>
);

export const PlugIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8Z" />
    <path d="M12 17v4" />
  </Stroke>
);

export const RackIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="M4 3v18M20 3v18M4 8h16M4 14h16M4 20h16" />
  </Stroke>
);

export const BroomIcon = (p: IconProps) => (
  <Stroke {...p}>
    <path d="m19 3-8.5 8.5" />
    <path d="M10.5 11.5 5 14l-2 7 7-2 2.5-5.5-2-2Z" />
    <path d="M6 16.5l1.5 1.5" />
  </Stroke>
);

// ───────────────────────────── Social ─────────────────────────────

export const FacebookIcon = (p: IconProps) => (
  <Fill {...p}>
    <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.4V21h3.1Z" />
  </Fill>
);

export const InstagramIcon = (p: IconProps) => (
  <Stroke {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
  </Stroke>
);

export const YoutubeIcon = (p: IconProps) => (
  <Fill {...p}>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
  </Fill>
);

export const TiktokIcon = (p: IconProps) => (
  <Fill {...p}>
    <path d="M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3c-1.4 0-2.7-.4-3.8-1.2v6.2a5.5 5.5 0 1 1-5.5-5.5c.3 0 .6 0 .9.1v3.1a2.5 2.5 0 1 0 1.6 2.3V3h3Z" />
  </Fill>
);

/** Simplified flag of Nepal: two crimson pennants with a blue border, moon above sun. */
export const NepalFlagIcon = (p: IconProps) => (
  <svg viewBox="0 0 20 24" aria-hidden="true" focusable="false" {...p}>
    <path d="M1 1h1.5l14 10H7.2l9.3 11H1V1Z" fill="#003893" />
    <path d="M2.5 2.6v18.8h11L4.8 11.5h8.6L2.5 2.6Z" fill="#DC143C" />
    <circle cx="6.5" cy="16.5" r="1.9" fill="#fff" />
    <path d="M4.6 7.4a2.6 2.6 0 0 0 4.4-1.2 2.2 2.2 0 0 1-4.4 1.2Z" fill="#fff" />
  </svg>
);
