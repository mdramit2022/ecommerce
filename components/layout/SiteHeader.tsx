import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { CartBadge } from "@/components/CartBadge";
import { AccountMenu, type HeaderUser } from "@/components/layout/AccountMenu";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { LocationPicker } from "@/components/layout/LocationPicker";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { WishlistLink } from "@/components/layout/WishlistLink";
import type { NavCategory } from "@/lib/catalog/categories";

export type SiteHeaderProps = {
  categories: NavCategory[];
  user: HeaderUser | null;
};

/**
 * Server Component. Main header: logo, catalog search, delivery location and the account /
 * wishlist / cart controls on desktop; hamburger, logo and cart plus a search row and location
 * row on phones. Interactive pieces are small Client Components at the leaves.
 */
export function SiteHeader({ categories, user }: SiteHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      {/* Desktop / tablet */}
      <div className="mx-auto hidden h-20 w-full max-w-7xl items-center gap-5 px-4 sm:px-6 md:flex lg:gap-8 lg:px-8">
        <Logo className="shrink-0" />

        <Suspense fallback={<div className="h-10 max-w-xl flex-1 rounded-full bg-neutral-100" />}>
          <HeaderSearch className="max-w-xl flex-1" />
        </Suspense>

        <LocationPicker className="hidden shrink-0 lg:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 border-l border-neutral-200 pl-4">
          <AccountMenu user={user} signOutAction={signOutAction} />
          <WishlistLink />
          <CartBadge />
        </div>
      </div>

      {/* Phone */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <MobileMenu categories={categories} user={user} signOutAction={signOutAction} />
          <Logo compact />
          <CartBadge variant="icon" className="-mr-2" />
        </div>
        <div className="px-4 pb-3">
          <Suspense fallback={<div className="h-10 rounded-full bg-neutral-100" />}>
            <HeaderSearch variant="mobile" />
          </Suspense>
        </div>
        <div className="border-t border-neutral-100 px-4">
          <LocationPicker variant="row" />
        </div>
      </div>
    </header>
  );
}
