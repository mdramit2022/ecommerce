import { CategoryMenuList } from "@/components/layout/CategoryMenuList";
import { MenuIcon } from "@/components/ui/Icon";
import type { NavCategory } from "@/lib/catalog/categories";

export type CategorySidebarProps = { categories: NavCategory[] };

/**
 * Server Component. The "All Categories" panel shown open beside the hero on the home page, as
 * in the reference design. Same rows as the dropdown in the nav (CategoryMenuList).
 */
export function CategorySidebar({ categories }: CategorySidebarProps) {
  return (
    <aside
      aria-label="All categories"
      className="hidden w-60 shrink-0 self-start overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm lg:block"
    >
      <p className="bg-brand-blue flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-white">
        <MenuIcon className="h-4 w-4" />
        All Categories
      </p>
      <CategoryMenuList categories={categories} />
    </aside>
  );
}
