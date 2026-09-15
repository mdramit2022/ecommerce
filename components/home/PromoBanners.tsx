import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/Icon";
import { PROMO_BANNERS, type PromoBanner } from "@/lib/brand";
import { cn } from "@/lib/utils";

const BUTTON_STYLES: Record<PromoBanner["button"], string> = {
  white: "bg-white text-neutral-900 hover:bg-neutral-100",
  outline: "border border-white/80 text-white hover:bg-white/10",
  blue: "bg-brand-blue text-white hover:bg-brand-blue-dark",
};

/** Server Component. Three collection tiles; only the festival tile shows on phones. */
export function PromoBanners() {
  return (
    <section aria-label="Collections" className="grid gap-4 lg:grid-cols-3">
      {PROMO_BANNERS.map((banner) => (
        <Link
          key={banner.title}
          href={banner.cta.href}
          className={cn(
            "group relative h-36 overflow-hidden rounded-xl bg-linear-to-r text-white shadow-sm sm:h-40",
            banner.gradient,
            banner.mobile ? "block" : "hidden lg:block",
          )}
        >
          <Image
            src={banner.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 420px, 100vw"
            className="[mask-image:linear-gradient(to_left,black_30%,transparent_85%)] object-cover opacity-40 mix-blend-luminosity transition duration-500 group-hover:scale-105 group-hover:opacity-50"
          />
          <div className="relative flex h-full flex-col justify-center gap-1.5 px-6">
            <p className="text-[15px] font-semibold text-white/90">{banner.eyebrow}</p>
            <p className="text-lg leading-tight font-bold sm:text-xl">{banner.title}</p>
            {banner.highlight && (
              <p className="text-brand-gold text-xl font-extrabold tracking-tight sm:text-2xl">
                {banner.highlight}
              </p>
            )}
            <span
              className={cn(
                "mt-2 inline-flex w-fit items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition",
                BUTTON_STYLES[banner.button],
              )}
            >
              {banner.cta.label}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
