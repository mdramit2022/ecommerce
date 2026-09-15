"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; exact?: boolean };
type NavGroup = { heading: string | null; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    heading: null,
    items: [
      { href: "/admin", label: "Dashboard", exact: true },
      { href: "/admin/products", label: "Products" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/orders", label: "Orders" },
      { href: "/admin/customers", label: "Customers" },
    ],
  },
  {
    heading: "Home page",
    items: [
      { href: "/admin/banners", label: "Banners" },
      { href: "/admin/testimonials", label: "Testimonials" },
      { href: "/admin/content", label: "Site content" },
      { href: "/admin/settings", label: "Store settings" },
    ],
  },
];

/** Client Component: sidebar navigation with active-route highlighting. */
export function AdminNav() {
  const pathname = usePathname();

  const link = (item: NavItem) => {
    const active = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition",
          active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100",
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Admin"
      className="-mx-1 flex gap-1 overflow-x-auto pb-1 md:mx-0 md:flex-col md:pb-0"
    >
      {NAV_GROUPS.map((group, index) => (
        <div key={group.heading ?? index} className="flex gap-1 md:flex-col">
          {group.heading && (
            <p className="hidden pt-4 pb-1 pl-3 text-[11px] font-semibold tracking-wide text-neutral-400 uppercase md:block">
              {group.heading}
            </p>
          )}
          {group.items.map(link)}
        </div>
      ))}
    </nav>
  );
}
