import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import type { NavCategory } from "@/lib/catalog/categories";
import { cn } from "@/lib/utils";

/** Pastel discs behind the category photos, cycled in order. */
const DISC_TONES = [
  "bg-amber-100",
  "bg-sky-100",
  "bg-rose-100",
  "bg-emerald-100",
  "bg-violet-100",
  "bg-orange-100",
  "bg-cyan-100",
  "bg-lime-100",
  "bg-fuchsia-100",
];

export type CategoryCirclesProps = { categories: NavCategory[] };

/** Server Component. Round category tiles with live product counts. */
export function CategoryCircles({ categories }: CategoryCirclesProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-label="Shop by category">
      <ul className="grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 [&>li:nth-child(n+9)]:hidden lg:[&>li:nth-child(n+9)]:block">
        {categories.map((category, index) => (
          <li key={category.id}>
            <Link
              href={`/shop?category=${encodeURIComponent(category.slug)}`}
              className="group flex flex-col items-center gap-2 text-center"
            >
              <span
                className={cn(
                  "group-hover:ring-brand-blue relative flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full ring-2 ring-transparent transition sm:h-20 sm:w-20 lg:h-[88px] lg:w-[88px]",
                  DISC_TONES[index % DISC_TONES.length],
                )}
              >
                {category.image ? (
                  <Image
                    src={category.image}
                    alt=""
                    fill
                    sizes="88px"
                    className="object-cover p-2 transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <CategoryIcon slug={category.slug} className="h-8 w-8 text-neutral-500" />
                )}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="group-hover:text-brand-blue text-[11px] font-semibold text-neutral-900 sm:text-xs">
                  {category.name}
                </span>
                <span className="text-[10px] text-neutral-500 sm:text-[11px]">
                  ({category.productCount} {category.productCount === 1 ? "item" : "items"})
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
