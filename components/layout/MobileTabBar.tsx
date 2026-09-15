"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  GridIcon,
  HeartIcon,
  HomeIcon,
  SearchIcon,
  ShoppingCartIcon,
  type IconProps,
} from "@/components/ui/Icon";
import { selectItemCount, useCart } from "@/lib/store/useCart";
import { selectWishlistCount, useWishlist } from "@/lib/store/useWishlist";
import { useHydrated } from "@/lib/store/useHydrated";
import { cn } from "@/lib/utils";

type Tab = {
  label: string;
  href: string;
  icon: ComponentType<IconProps>;
  /** Paths that light the tab up. */
  match: (pathname: string) => boolean;
  badge?: "cart" | "wishlist";
};

const TABS: Tab[] = [
  { label: "Home", href: "/", icon: HomeIcon, match: (p) => p === "/" },
  {
    label: "Categories",
    href: "/shop",
    icon: GridIcon,
    match: (p) => p === "/shop" || p.startsWith("/products"),
  },
  { label: "Search", href: "/shop?focus=search", icon: SearchIcon, match: () => false },
  {
    label: "Wishlist",
    href: "/wishlist",
    icon: HeartIcon,
    match: (p) => p.startsWith("/wishlist"),
    badge: "wishlist",
  },
  {
    label: "Cart",
    href: "/cart",
    icon: ShoppingCartIcon,
    match: (p) => p.startsWith("/cart") || p.startsWith("/checkout"),
    badge: "cart",
  },
];

/**
 * Client Component: fixed bottom navigation on phones (hidden from `md` up). The root layout adds
 * matching bottom padding so page content never hides behind it.
 */
export function MobileTabBar() {
  const pathname = usePathname() ?? "/";
  const hydrated = useHydrated();
  const cartCount = useCart(selectItemCount);
  const wishlistCount = useWishlist(selectWishlistCount);

  const badgeFor = (badge: Tab["badge"]): number => {
    if (!hydrated || !badge) return 0;
    return badge === "cart" ? cartCount : wishlistCount;
  };

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid h-16 grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const count = badgeFor(tab.badge);
          const Icon = tab.icon;
          return (
            <li key={tab.label}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active ? "text-brand-blue" : "text-neutral-500",
                )}
              >
                <span className="relative">
                  <Icon className="h-5.5 w-5.5" />
                  {count > 0 && (
                    <span
                      aria-label={`${count} items`}
                      className="bg-brand-red absolute -top-1.5 -right-2 inline-flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-4 font-bold text-white"
                    >
                      {count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
