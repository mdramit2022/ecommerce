"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SearchIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export type HeaderSearchProps = {
  className?: string;
  placeholder?: string;
  /** `pill` is the desktop header field; `mobile` the grey full-width row under it. */
  variant?: "pill" | "mobile";
};

/**
 * Client Component: the catalog search box. Submits to /shop?q=... and keeps the current term
 * when already on the catalog. Wrap in <Suspense> - it reads the URL search params.
 */
export function HeaderSearch({
  className,
  placeholder = "Search for pressure cooker, kadhai, mug, plate...",
  variant = "pill",
}: HeaderSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const inputId = `header-search-${variant}`;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `/shop?q=${encodeURIComponent(trimmed)}` : "/shop");
  };

  if (variant === "mobile") {
    return (
      <form onSubmit={onSubmit} role="search" className={cn("relative", className)}>
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search for products..."
          autoFocus={searchParams.get("focus") === "search"}
          className="focus:border-brand-blue focus:ring-brand-blue/15 h-10 w-full rounded-full border border-neutral-200 bg-neutral-100 pr-4 pl-10 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:bg-white focus:ring-2"
        />
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={cn(
        "focus-within:border-brand-blue focus-within:ring-brand-blue/15 flex h-10 w-full items-stretch overflow-hidden rounded-full border border-neutral-300 bg-white transition focus-within:ring-2",
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
      />
      <button
        type="submit"
        aria-label="Search"
        className="bg-brand-blue hover:bg-brand-blue-dark flex w-12 shrink-0 items-center justify-center text-white transition"
      >
        <SearchIcon className="h-4.5 w-4.5" />
      </button>
    </form>
  );
}
