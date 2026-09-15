import Image from "next/image";
import Link from "next/link";
import { BANNER_BUTTON_STYLES } from "@/components/home/PromoBanners";
import { ArrowRightIcon } from "@/components/ui/Icon";
import { BANNER_THEME_META, bannerTheme } from "@/lib/content/kinds";
import { cn } from "@/lib/utils";
import type { BannerData } from "@/types/content";

export type SideBannerProps = { banner: BannerData };

/**
 * Server Component. The tall promotional banner beside the hero on desktop, in the column the
 * category panel used to occupy. Stretches to the height of the hero + category row next to it.
 */
export function SideBanner({ banner }: SideBannerProps) {
  const theme = BANNER_THEME_META[bannerTheme("SIDEBAR", banner.theme)];
  const body = (
    <>
      <Image
        src={banner.image}
        alt=""
        fill
        sizes="240px"
        className="[mask-image:linear-gradient(to_top,black_40%,transparent_100%)] object-cover opacity-50 transition duration-500 group-hover:scale-105 group-hover:opacity-60"
      />
      <div className="relative flex h-full flex-col justify-between p-5">
        <div>
          {banner.eyebrow && (
            <p className="text-[11px] font-bold tracking-wide text-white/85 uppercase">
              {banner.eyebrow}
            </p>
          )}
          <p className="mt-1 text-2xl leading-tight font-extrabold tracking-tight">
            {banner.title}
          </p>
          {banner.highlight && (
            <p className="text-brand-gold mt-1.5 text-lg font-bold">{banner.highlight}</p>
          )}
          {banner.description && (
            <p className="mt-2 text-[13px] leading-relaxed text-white/80">{banner.description}</p>
          )}
        </div>
        {banner.ctaLabel && banner.ctaHref && (
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold transition",
              BANNER_BUTTON_STYLES[theme.button],
            )}
          >
            {banner.ctaLabel}
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  const className = cn(
    "group relative hidden w-60 shrink-0 self-stretch overflow-hidden rounded-xl bg-linear-to-b text-white shadow-sm lg:block",
    theme.gradient,
  );

  return banner.ctaHref ? (
    <Link href={banner.ctaHref} aria-label={banner.title} className={className}>
      {body}
    </Link>
  ) : (
    <aside aria-label={banner.title} className={className}>
      {body}
    </aside>
  );
}
