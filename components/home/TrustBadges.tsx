import type { ComponentType } from "react";
import {
  AwardIcon,
  BadgeCheckIcon,
  LockIcon,
  PackageIcon,
  TruckIcon,
  type IconProps,
} from "@/components/ui/Icon";
import { TRUST_BADGES, type TrustBadgeIcon } from "@/lib/brand";

const ICONS: Record<TrustBadgeIcon, ComponentType<IconProps>> = {
  years: AwardIcon,
  selection: PackageIcon,
  quality: BadgeCheckIcon,
  secure: LockIcon,
  delivery: TruckIcon,
};

/** Server Component. Reassurance row: five reasons to buy here. */
export function TrustBadges() {
  return (
    <section
      aria-label="Why shop with us"
      className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-6"
    >
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {TRUST_BADGES.map((badge) => {
          const Icon = ICONS[badge.icon];
          return (
            <li key={badge.icon} className="flex items-center gap-3">
              <span className="bg-brand-blue-light text-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-neutral-900">{badge.title}</span>
                <span className="text-xs text-neutral-500">{badge.subtitle}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
