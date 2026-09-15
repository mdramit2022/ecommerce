import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icon";
import { BANNER_THEME_META, bannerTheme, type BannerButtonStyle } from "@/lib/content/kinds";
import { cn } from "@/lib/utils";
import type { BannerData } from "@/types/content";

export const BANNER_BUTTON_STYLES: Record<BannerButtonStyle, string> = {
  white: "bg-white text-neutral-900 hover:bg-neutral-100",
  outline: "border border-white/80 text-white hover:bg-white/10",
  blue: "bg-brand-blue text-white hover:bg-brand-blue-dark",
  orange: "bg-brand-orange text-white hover:bg-brand-orange-dark",
};

export type PromoBannersProps = {
  /** Active PROMO_TILE banners in sort order. Three fit a desktop row; only the first shows on phones. */
  tiles: BannerData[];
};

/** Server Component. Collection tiles between Best Sellers and New Arrivals. */
export function PromoBanners({ tiles }: PromoBannersProps) {
  if (tiles.length === 0) return null;

  return (
    <section aria-label="Collections" className="grid gap-4 lg:grid-cols-3">
      {tiles.map((tile, index) => {
        const theme = BANNER_THEME_META[bannerTheme("PROMO_TILE", tile.theme)];
        const body = (
          <>
            <Image
              src={tile.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="[mask-image:linear-gradient(to_left,black_30%,transparent_85%)] object-cover opacity-40 mix-blend-luminosity transition duration-500 group-hover:scale-105 group-hover:opacity-50"
            />
            <div className="relative flex h-full flex-col justify-center gap-1.5 px-6">
              {tile.eyebrow && (
                <p className="text-[15px] font-semibold text-white/90">{tile.eyebrow}</p>
              )}
              <p className="text-lg leading-tight font-bold sm:text-xl">{tile.title}</p>
              {tile.highlight && (
                <p className="text-brand-gold text-xl font-extrabold tracking-tight sm:text-2xl">
                  {tile.highlight}
                </p>
              )}
              {tile.ctaLabel && tile.ctaHref && (
                <span
                  className={cn(
                    "mt-2 inline-flex w-fit items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition",
                    BANNER_BUTTON_STYLES[theme.button],
                  )}
                >
                  {tile.ctaLabel}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              )}
            </div>
          </>
        );
        const className = cn(
          "group relative h-36 overflow-hidden rounded-xl bg-linear-to-r text-white shadow-sm sm:h-40",
          theme.gradient,
          index === 0 ? "block" : "hidden lg:block",
        );
        return tile.ctaHref ? (
          <Link key={tile.id} href={tile.ctaHref} className={className}>
            {body}
          </Link>
        ) : (
          <div key={tile.id} className={className}>
            {body}
          </div>
        );
      })}
    </section>
  );
}
