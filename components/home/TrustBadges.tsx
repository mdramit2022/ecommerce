import { ContentIcon } from "@/components/layout/ContentIcon";
import type { SiteContentItemData } from "@/types/content";

export type TrustBadgesProps = {
  /** Active TRUST_BADGE items in sort order. */
  badges: SiteContentItemData[];
};

/** Server Component. Reassurance row: the admin-managed reasons to buy here. */
export function TrustBadges({ badges }: TrustBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <section
      aria-label="Why shop with us"
      className="rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm sm:px-6"
    >
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:flex lg:items-center lg:justify-between">
        {badges.map((badge) => (
          <li key={badge.id} className="flex items-center gap-3 lg:flex-1">
            <span className="bg-brand-blue-light text-brand-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <ContentIcon icon={badge.icon} className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-neutral-900">{badge.title}</span>
              {badge.subtitle && <span className="text-xs text-neutral-500">{badge.subtitle}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
