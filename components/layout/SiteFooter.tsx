import Link from "next/link";
import type { ComponentType } from "react";
import { Logo } from "@/components/layout/Logo";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import {
  FacebookIcon,
  InstagramIcon,
  TiktokIcon,
  YoutubeIcon,
  type IconProps,
} from "@/components/ui/Icon";
import { BRAND, FOOTER_COLUMNS, SOCIAL_LINKS } from "@/lib/brand";
import { PAYMENT_METHOD_VALUES, getPaymentMethod } from "@/lib/payments/methods";

const SOCIAL_ICONS: Record<(typeof SOCIAL_LINKS)[number]["name"], ComponentType<IconProps>> = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YoutubeIcon,
  TikTok: TiktokIcon,
};

/** Server Component. Navy footer: brand, four link columns, newsletter, legal line. */
export function SiteFooter() {
  const year = new Date().getFullYear();
  const external = (href: string) => /^https?:\/\//.test(href);

  return (
    <footer className="bg-brand-navy mt-16 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)_1.4fr]">
          <div className="lg:pr-6">
            <Logo tone="light" />
            <p className="mt-4 text-sm leading-relaxed text-white/70">{BRAND.description}</p>
            <ul className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = SOCIAL_ICONS[social.name];
                return (
                  <li key={social.name}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.name}
                      className="hover:bg-brand-blue flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/85 transition hover:text-white"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="text-sm font-semibold text-white">{column.heading}</h2>
              <ul className="mt-4 space-y-2.5 text-[13px] text-white/70">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    {external(link.href) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-white"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="transition hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="md:col-span-2 lg:col-span-1">
            <h2 className="text-sm font-semibold text-white">Subscribe to Our Newsletter</h2>
            <p className="mt-4 mb-3 text-[13px] text-white/70">
              Get updates about new products and exclusive offers.
            </p>
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
