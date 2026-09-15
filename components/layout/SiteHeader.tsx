import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { CartBadge } from "@/components/CartBadge";
import { AccountMenu, type HeaderUser } from "@/components/layout/AccountMenu";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Logo } from "@/components/layout/Logo";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { WishlistLink } from "@/components/layout/WishlistLink";
import type { NavCategory } from "@/lib/catalog/categories";

export type SiteHeaderProps = {
  categories: NavCategory[];
  user: HeaderUser | null;
  /** Store phone number for the phone drawer (from store settings). */
  phone: string;
};

/**
 * Server Component. Main header: logo, a catalog search that takes the remaining width, and the
 * wishlist / cart / account controls on desktop; hamburger, logo and cart plus a search row on
 * phones. The delivery-location picker is hidden for now (components/layout/LocationPicker.tsx).
 */
export function SiteHeader({ categories, user, phone }: SiteHeaderProps) {
  return (
    <header className="border-b border-neutral-200 bg-white">
      {/* Desktop / tablet */}
      <div className="mx-auto hidden h-20 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 md:flex lg:gap-8 lg:px-8">
        <Logo className="shrink-0" />

        <Suspense fallback={<div className="h-10 min-w-0 flex-1 rounded-full bg-neutral-100" />}>
          <HeaderSearch className="min-w-0 flex-1" />
        </Suspense>

        <div className="flex shrink-0 items-center gap-1 border-l border-neutral-200 pl-4">
          <WishlistLink />
          <CartBadge />
          <AccountMenu user={user} signOutAction={signOutAction} />
        </div>
      </div>

      {/* Phone */}
      <div className="md:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <MobileMenu
            categories={categories}
            user={user}
            signOutAction={signOutAction}
            phone={phone}
          />
          <Logo compact />
          <CartBadge variant="icon" className="-mr-2" />
        </div>
        <div className="px-4 pb-3">
          <Suspense fallback={<div className="h-10 rounded-full bg-neutral-100" />}>
            <HeaderSearch variant="mobile" />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
