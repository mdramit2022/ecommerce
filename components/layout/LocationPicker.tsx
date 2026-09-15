"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DEFAULT_DELIVERY_CITY, DELIVERY_CITIES, type DeliveryCity } from "@/lib/brand";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, MapPinIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "delivery-city";

function isDeliveryCity(value: string | null): value is DeliveryCity {
  return value !== null && (DELIVERY_CITIES as readonly string[]).includes(value);
}

export type LocationPickerProps = {
  /** `header` is the two-line desktop control; `row` the full-width mobile line. */
  variant?: "header" | "row";
  className?: string;
};

/**
 * Client Component: the "Kathmandu / Change Location" control. The chosen city is remembered
 * per browser; nothing about pricing or availability depends on it yet, it personalises copy.
 * The default city renders first so server and client markup match, then storage is read.
 */
export function LocationPicker({ variant = "header", className }: LocationPickerProps) {
  const [city, setCity] = useState<DeliveryCity>(DEFAULT_DELIVERY_CITY);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (isDeliveryCity(stored)) setCity(stored);
    } catch {
      // Storage unavailable (private mode) - keep the default.
    }
  }, []);

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

  const choose = (next: DeliveryCity) => {
    setCity(next);
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Best effort only.
    }
  };

  const menu = open && (
    <ul
      id={listId}
      role="listbox"
      aria-label="Delivery city"
      className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
    >
      {DELIVERY_CITIES.map((option) => (
        <li key={option}>
          <button
            type="button"
            role="option"
            aria-selected={option === city}
            onClick={() => choose(option)}
            className={cn(
              "hover:bg-brand-blue-light flex w-full items-center justify-between px-3.5 py-2 text-left text-sm",
              option === city ? "text-brand-blue font-semibold" : "text-neutral-800",
            )}
          >
            {option}
            {option === city && <CheckIcon className="h-4 w-4" />}
          </button>
        </li>
      ))}
    </ul>
  );

  if (variant === "row") {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-full items-center justify-between py-2 text-sm"
        >
          <span className="flex items-center gap-1.5 text-neutral-800">
            <MapPinIcon className="text-brand-blue h-4 w-4" />
            <span className="font-medium">{city}</span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-neutral-500" />
          </span>
          <ChevronRightIcon className="h-4 w-4 text-neutral-400" />
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-neutral-50"
      >
        <MapPinIcon className="text-brand-blue h-5 w-5 shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-neutral-900">{city}</span>
          <span className="flex items-center gap-0.5 text-[11px] text-neutral-500">
            Change Location
            <ChevronDownIcon className="h-3 w-3" />
          </span>
        </span>
      </button>
      {menu}
    </div>
  );
}
