import type { ComponentType } from "react";
import { ANNOUNCEMENTS, SOCIAL_LINKS, type AnnouncementIcon } from "@/lib/brand";
import {
  BanknoteIcon,
  ChevronDownIcon,
  FacebookIcon,
  InstagramIcon,
  NepalFlagIcon,
  ShieldCheckIcon,
  TiktokIcon,
  TruckIcon,
  YoutubeIcon,
  type IconProps,
} from "@/components/ui/Icon";

const ANNOUNCEMENT_ICONS: Record<AnnouncementIcon, ComponentType<IconProps>> = {
  truck: TruckIcon,
  shield: ShieldCheckIcon,
  cash: BanknoteIcon,
};

const SOCIAL_ICONS = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YoutubeIcon,
  TikTok: TiktokIcon,
} satisfies Record<(typeof SOCIAL_LINKS)[number]["name"], ComponentType<IconProps>>;

/**
 * Server Component. Navy strip above the header: delivery promises on the left, social links and
 * the region flag on the right. Desktop only - the mobile header keeps its chrome to one row.
 */
export function AnnouncementBar() {
  return (
    <div className="bg-brand-navy hidden text-white md:block">
      <div className="mx-auto flex h-8 w-full max-w-7xl items-center justify-between px-4 text-[11px] font-medium sm:px-6 lg:px-8">
        <ul className="flex items-center divide-x divide-white/25">
          {ANNOUNCEMENTS.map((item) => {
            const Icon = ANNOUNCEMENT_ICONS[item.icon];
            return (
              <li key={item.text} className="flex items-center gap-1.5 px-4 first:pl-0">
                <Icon className="h-3.5 w-3.5 text-white/80" />
                <span>{item.text}</span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center divide-x divide-white/25">
          <div className="flex items-center gap-2.5 pr-4">
            <span className="text-white/80">Follow Us:</span>
            {SOCIAL_LINKS.map((social) => {
              const Icon = SOCIAL_ICONS[social.name];
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.name}
                  className="text-white/85 transition hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              );
            })}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 pl-4 text-white/85 hover:text-white"
            aria-label="Region: Nepal"
          >
            <NepalFlagIcon className="h-4 w-3.5" />
            <ChevronDownIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
