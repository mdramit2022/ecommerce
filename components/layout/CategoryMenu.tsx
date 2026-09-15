"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CategoryMenuList } from "@/components/layout/CategoryMenuList";
import { MenuIcon } from "@/components/ui/Icon";
import type { NavCategory } from "@/lib/catalog/categories";
import { cn } from "@/lib/utils";

export type CategoryMenuProps = {
  categories: NavCategory[];
  className?: string;
};

/**
 * Client Component: the blue "All Categories" button in the desktop nav and its dropdown panel.
 * Closes on outside click, Escape and route change. On the home page the same list is shown as
 * a permanent sidebar instead (see components/home/CategorySidebar), so the button only toggles.
 */
export function CategoryMenu({ categories, className }: CategoryMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "bg-brand-blue hover:bg-brand-blue-dark flex h-10 w-60 items-center gap-2.5 rounded-md px-4 text-sm font-semibold text-white transition",
          open && "rounded-b-none",
        )}
      >
        <MenuIcon className="h-4.5 w-4.5" />
        All Categories
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute top-full left-0 z-40 w-60 overflow-hidden rounded-b-xl border border-t-0 border-neutral-200 bg-white shadow-xl"
      >
        <CategoryMenuList categories={categories} />
      </div>
    </div>
  );
}
