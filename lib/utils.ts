import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conditional support. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** The store trades in Nepali rupees; orders record this code in lowercase ("npr"). */
export const DEFAULT_CURRENCY = "NPR";

/**
 * Format a decimal amount for display.
 *
 * Rupees follow the local convention - `Rs. 3,250`, with paisa only when there are any
 * (`Rs. 1,234.50`) - because `Intl` renders NPR as "NPR 3,250.00" or "रु", neither of which is
 * what Nepali shoppers expect. Every other ISO code (historic USD orders, Stripe test data) goes
 * through `Intl.NumberFormat` unchanged, e.g. `$1,234.50`.
 */
export function formatPrice(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  locale = "en-US",
): string {
  const code = currency.toUpperCase();

  if (code === "NPR") {
    const rounded = Math.round(Math.abs(amount) * 100) / 100;
    const digits = Number.isInteger(rounded) ? 0 : 2;
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: 2,
    }).format(rounded);
    return `${amount < 0 && rounded > 0 ? "-" : ""}Rs. ${number}`;
  }

  return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** "Sep 10, 2026". Fixed locale so Server Component output is deterministic. */
export function formatDate(value: string | Date): string {
  return dateFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** "Sep 10, 2026, 9:41 PM". Fixed locale so Server Component output is deterministic. */
export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}

/** Create a URL-safe slug from arbitrary text, e.g. "Hello World_x" -> "hello-world-x". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Generate a human-friendly order number, e.g. ORD-20260910-7F3KQ2. */
export function generateOrderNumber(date: Date = new Date()): string {
  const ymd = date.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

/** Whole-percent saving between a compare-at price and the selling price; 0 when not on sale. */
export function percentOff(price: number, compareAtPrice: number | null | undefined): number {
  if (compareAtPrice === null || compareAtPrice === undefined) return 0;
  if (compareAtPrice <= 0 || compareAtPrice <= price) return 0;
  return Math.round((1 - price / compareAtPrice) * 100);
}
