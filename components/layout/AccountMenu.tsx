"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDownIcon, UserIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type HeaderUser = {
  name: string | null;
  email: string | null;
  isAdmin: boolean;
};

export type AccountMenuProps = {
  user: HeaderUser | null;
  /** Server Action that signs the user out and redirects home. */
  signOutAction: () => Promise<void>;
  className?: string;
};

/**
 * Client Component: the "Account" control in the desktop header. Guests get a link to sign in;
 * signed-in customers get a dropdown with their account pages and sign-out.
 */
export function AccountMenu({ user, signOutAction, className }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const control =
    "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-neutral-800 transition hover:text-brand-blue";

  if (!user) {
    return (
      <Link href="/sign-in" className={cn(control, className)}>
        <UserIcon className="h-6 w-6" />
        <span className="text-[11px] font-medium">Account</span>
      </Link>
    );
  }

  const links = [
    { href: "/account", label: "My Account" },
    { href: "/account/orders", label: "Orders" },
    { href: "/account/addresses", label: "Addresses" },
    ...(user.isAdmin ? [{ href: "/admin", label: "Admin dashboard" }] : []),
  ];

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={control}
      >
        <UserIcon className="h-6 w-6" />
        <span className="flex items-center gap-0.5 text-[11px] font-medium">
          Account
          <ChevronDownIcon className="h-3 w-3" />
        </span>
      </button>

      <div
        id={menuId}
        role="menu"
        hidden={!open}
        className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
      >
        <p className="truncate px-3.5 py-2 text-xs text-neutral-500">
          Signed in as{" "}
          <span className="font-medium text-neutral-800">{user.name ?? user.email}</span>
        </p>
        {links.map((link) => (
          <Link
            key={link.href}
            role="menuitem"
            href={link.href}
            className="hover:bg-brand-blue-light hover:text-brand-blue block px-3.5 py-2 text-sm text-neutral-800"
          >
            {link.label}
          </Link>
        ))}
        <form action={signOutAction} className="border-t border-neutral-100">
          <button
            type="submit"
            role="menuitem"
            className="hover:bg-brand-blue-light hover:text-brand-blue block w-full px-3.5 py-2 text-left text-sm text-neutral-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
