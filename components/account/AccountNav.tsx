"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders", exact: false },
  { href: "/account/addresses", label: "Addresses", exact: false },
  { href: "/account/profile", label: "Profile", exact: false },
] as const;

/** Client Component: account side navigation with active-link styling from the current pathname. */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto lg:flex-col">
      {links.map(({ href, label, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition",
              active
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
