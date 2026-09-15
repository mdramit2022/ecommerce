"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import type { HeaderUser } from "@/components/layout/AccountMenu";
import { CategoryMenuList } from "@/components/layout/CategoryMenuList";
import { Logo } from "@/components/layout/Logo";
import { MenuIcon, PhoneIcon, XIcon } from "@/components/ui/Icon";
import type { NavCategory } from "@/lib/catalog/categories";
import { telHref } from "@/lib/content/settings";

export type MobileMenuProps = {
  categories: NavCategory[];
  user: HeaderUser | null;
  signOutAction: () => Promise<void>;
  /** Store phone number from settings. */
  phone: string;
};

const PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/shop?sort=newest" },
  { label: "Offers", href: "/shop?onSale=true" },
];

/**
 * Client Component: hamburger button + slide-in drawer for phones and tablets. Carries the same
 * destinations as the desktop nav and account menu. Closes on navigation and Escape; locks page
 * scroll while open.
 */
export function MobileMenu({ categories, user, signOutAction, phone }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const drawerId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClass =
    "block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-800 hover:bg-brand-blue-light hover:text-brand-blue";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={drawerId}
        className="text-brand-blue-dark -ml-2 flex h-10 w-10 items-center justify-center rounded-lg hover:bg-neutral-100"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-neutral-900/50"
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-[85vw] max-w-sm flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <Logo compact />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-6">
              <div className="border-b border-neutral-200 px-4 py-4">
                {user ? (
                  <>
                    <p className="text-xs text-neutral-500">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-neutral-900">
                      {user.name ?? user.email}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <Link
                        href="/account"
                        className="hover:border-brand-blue hover:text-brand-blue rounded-lg border border-neutral-300 px-3 py-2 text-center font-medium"
                      >
                        My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        className="hover:border-brand-blue hover:text-brand-blue rounded-lg border border-neutral-300 px-3 py-2 text-center font-medium"
                      >
                        Orders
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="hover:border-brand-blue hover:text-brand-blue rounded-lg border border-neutral-300 px-3 py-2 text-center font-medium"
                        >
                          Admin
                        </Link>
                      )}
                      <form action={signOutAction} className="contents">
                        <button
                          type="submit"
                          className="hover:border-brand-red hover:text-brand-red rounded-lg border border-neutral-300 px-3 py-2 text-center font-medium"
                        >
                          Sign out
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Link
                      href="/sign-in"
                      className="bg-brand-blue hover:bg-brand-blue-dark rounded-lg px-3 py-2 text-center font-semibold text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className="hover:border-brand-blue hover:text-brand-blue rounded-lg border border-neutral-300 px-3 py-2 text-center font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>

              <nav aria-label="Primary" className="border-b border-neutral-200 px-2 py-2">
                {PRIMARY_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClass}>
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="py-2">
                <p className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  Categories
                </p>
                <CategoryMenuList categories={categories} />
              </div>
            </div>

            <a
              href={telHref(phone)}
              className="flex items-center gap-2 border-t border-neutral-200 px-4 py-3 text-sm text-neutral-700"
            >
              <PhoneIcon className="text-brand-blue h-4 w-4" />
              <span>
                Need help? <span className="font-semibold text-neutral-900">{phone}</span>
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
