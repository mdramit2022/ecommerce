import Link from "next/link";
import { ContentIcon } from "@/components/layout/ContentIcon";
import { SOCIAL_NETWORK_LABELS, isSocialNetworkKey } from "@/lib/content/kinds";
import type { SiteContentItemData } from "@/types/content";

export type AnnouncementBarProps = {
  announcements: SiteContentItemData[];
  socialLinks: SiteContentItemData[];
};

/**
 * Server Component. Navy strip above the header: the admin-managed announcements on the left,
 * social links on the right. Desktop only - the phone header keeps its chrome to one row.
 * Renders nothing when both lists are empty.
 */
export function AnnouncementBar({ announcements, socialLinks }: AnnouncementBarProps) {
  if (announcements.length === 0 && socialLinks.length === 0) return null;

  return (
    <div className="bg-brand-navy hidden text-white md:block">
      <div className="mx-auto flex h-8 w-full max-w-7xl items-center justify-between px-4 text-[11px] font-medium sm:px-6 lg:px-8">
        <ul className="flex items-center divide-x divide-white/25">
          {announcements.map((item) => {
            const body = (
              <>
                <ContentIcon icon={item.icon} className="h-3.5 w-3.5 text-white/80" />
                <span>{item.title}</span>
              </>
            );
            return (
              <li key={item.id} className="flex items-center gap-1.5 px-4 first:pl-0">
                {item.href ? (
                  <Link href={item.href} className="flex items-center gap-1.5 hover:text-white/80">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>

        {socialLinks.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-white/80">Follow Us:</span>
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.href ?? "#"}
                target="_blank"
                rel="noreferrer"
                aria-label={
                  social.title ||
                  (isSocialNetworkKey(social.icon)
                    ? SOCIAL_NETWORK_LABELS[social.icon]
                    : "Social link")
                }
                className="text-white/85 transition hover:text-white"
              >
                <ContentIcon icon={social.icon} className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
