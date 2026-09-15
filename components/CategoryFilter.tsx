import Link from "next/link";
import { cn } from "@/lib/utils";

export type CategoryFilterProps = {
  categories: { name: string; slug: string; productCount: number }[];
  activeSlug?: string;
  /** Current query string values to preserve (e.g. q, sort). */
  preserve?: Record<string, string | undefined>;
  /** Catalog route the chips filter. */
  basePath?: string;
};

/** Server Component: category chips rendered as links so filtering works without JS. */
export function CategoryFilter({
  categories,
  activeSlug,
  preserve = {},
  basePath = "/shop",
}: CategoryFilterProps) {
  const buildHref = (slug?: string) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(preserve)) {
      if (value) params.set(key, value);
    }
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const chip = (label: string, href: string, active: boolean, count?: number) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-brand-blue bg-brand-blue text-white"
          : "hover:border-brand-blue hover:text-brand-blue border-neutral-300 bg-white text-neutral-700",
      )}
    >
      {label}
      {typeof count === "number" && (
        <span className={cn("text-xs", active ? "text-white/70" : "text-neutral-400")}>
          {count}
        </span>
      )}
    </Link>
  );

  return (
    <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
      {chip("All", buildHref(), !activeSlug)}
      {categories.map((c) =>
        chip(c.name, buildHref(c.slug), c.slug === activeSlug, c.productCount),
      )}
    </nav>
  );
}
