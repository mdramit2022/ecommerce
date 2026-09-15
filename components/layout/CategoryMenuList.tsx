import Link from "next/link";
import { CategoryIcon } from "@/components/layout/CategoryIcon";
import { ChevronRightIcon } from "@/components/ui/Icon";
import type { NavCategory } from "@/lib/catalog/categories";
import { cn } from "@/lib/utils";

/** Merchandising shortcuts listed after the real categories, as in the reference design. */
export const MERCHANDISING_LINKS = [
  { slug: "new-arrivals", name: "New Arrivals", href: "/shop?sort=newest" },
  { slug: "best-sellers", name: "Best Sellers", href: "/shop?featured=true" },
  { slug: "offers", name: "Offers", href: "/shop?onSale=true" },
] as const;

export type CategoryMenuListProps = {
  categories: NavCategory[];
  /** Called on the client menu to close the panel after navigating. Optional for static use. */
  className?: string;
  linkClassName?: string;
};

/**
 * The rows of the "All Categories" panel: icon, name, chevron. Server-safe (no hooks), so the
 * same list renders inside the client dropdown, the static home-page sidebar and the mobile drawer.
 */
export function CategoryMenuList({ categories, className, linkClassName }: CategoryMenuListProps) {
  const row = (slug: string, name: string, href: string) => (
    <li key={slug}>
      <Link
        href={href}
        className={cn(
          "hover:bg-brand-blue-light hover:text-brand-blue flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-neutral-700 transition",
          linkClassName,
        )}
      >
        <CategoryIcon slug={slug} className="h-4 w-4 shrink-0 text-neutral-500" />
        <span className="flex-1">{name}</span>
        <ChevronRightIcon className="h-3.5 w-3.5 text-neutral-400" />
      </Link>
    </li>
  );

  return (
    <ul className={cn("divide-y divide-neutral-100", className)}>
      {categories.map((category) =>
        row(category.slug, category.name, `/shop?category=${encodeURIComponent(category.slug)}`),
      )}
      {MERCHANDISING_LINKS.map((link) => row(link.slug, link.name, link.href))}
    </ul>
  );
}
