import Link from "next/link";
import { CategoryMenu } from "@/components/layout/CategoryMenu";
import type { NavCategory } from "@/lib/catalog/categories";

/** Menu labels that read better short. Everything else uses the category name. */
const SHORT_NAMES: Record<string, string> = { "plastic-products": "Plastic" };

/** Links that fit one row at 1280px; every category is still reachable from the menu. */
const MAX_NAV_CATEGORIES = 8;

export type CategoryNavProps = {
  categories: NavCategory[];
};

/**
 * Server Component. Second header row on desktop: the "All Categories" dropdown followed by the
 * primary links. Below `lg` the mobile drawer (MobileMenu) carries the same destinations.
 */
export function CategoryNav({ categories }: CategoryNavProps) {
  const links = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...categories.slice(0, MAX_NAV_CATEGORIES).map((category) => ({
      label: SHORT_NAMES[category.slug] ?? category.name,
      href: `/shop?category=${encodeURIComponent(category.slug)}`,
    })),
    { label: "Offers", href: "/shop?onSale=true" },
  ];

  return (
    <nav aria-label="Categories" className="hidden border-b border-neutral-200 bg-white lg:block">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <CategoryMenu categories={categories} className="shrink-0" />
        <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-4 overflow-x-auto text-[13px] font-medium text-neutral-800">
          {links.map((link) => (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                className="hover:text-brand-blue py-3 whitespace-nowrap transition"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
