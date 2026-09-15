import Link from "next/link";
import { ContentIcon } from "@/components/layout/ContentIcon";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { BRAND } from "@/lib/brand";
import { SOCIAL_NETWORK_LABELS, isSocialNetworkKey, type SiteSettings } from "@/lib/content/kinds";
import { PAYMENT_METHOD_VALUES, getPaymentMethod } from "@/lib/payments/methods";
import type { FooterColumnData, SiteContentItemData } from "@/types/content";

export type SiteFooterProps = {
  columns: FooterColumnData[];
  socialLinks: SiteContentItemData[];
  settings: SiteSettings;
};

const isExternal = (href: string) => /^https?:\/\//i.test(href);

/** Server Component. Navy footer: brand, admin-managed link columns, newsletter, legal line. */
export function SiteFooter({ columns, socialLinks, settings }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const columnCount = Math.min(columns.length, 4);

  return (
    <footer className="bg-brand-navy mt-16 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div
          className="grid gap-10 md:grid-cols-2"
          style={{
            // Brand + N link columns + newsletter on desktop; the count follows the admin's columns.
            gridTemplateColumns: undefined,
          }}
          data-columns={columnCount}
        >
          <div className="lg:pr-6">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">{BRAND.description}</p>
            {socialLinks.length > 0 && (
              <ul className="mt-5 flex items-center gap-3">
                {socialLinks.map((social) => (
                  <li key={social.id}>
                    <a
                      href={social.href ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        social.title ||
                        (isSocialNetworkKey(social.icon)
                          ? SOCIAL_NETWORK_LABELS[social.icon]
                          : "Social link")
                      }
                      className="hover:bg-brand-blue flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 transition hover:text-white"
                    >
                      <ContentIcon icon={social.icon} className="h-4 w-4" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold text-white">{column.heading}</h2>
              <ul className="mt-4 space-y-2.5 text-[13px] text-white/70">
                {column.links.map((link) => (
                  <li key={link.id}>
                    {link.href && isExternal(link.href) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-white"
                      >
                        {link.title}
                      </a>
                    ) : (
                      <Link href={link.href ?? "/"} className="transition hover:text-white">
                        {link.title}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-sm font-semibold text-white">Subscribe to Our Newsletter</h2>
            <p className="mt-4 mb-3 text-[13px] text-white/70">{settings.newsletterBlurb}</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {BRAND.name}. All rights reserved.
          </p>
          <p>
            We accept:{" "}
            {PAYMENT_METHOD_VALUES.map((value) => getPaymentMethod(value).label).join(" · ")}
          </p>
        </div>
      </div>
    </footer>
  );
}
