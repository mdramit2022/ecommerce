import Link from "next/link";
import { cn } from "@/lib/utils";

export type PaginationProps = {
  page: number;
  totalPages: number;
  /** Query params to preserve (category, q, sort, ...). */
  preserve?: Record<string, string | undefined>;
  /** Route the page links point at. */
  basePath?: string;
};

export function Pagination({
  page,
  totalPages,
  preserve = {},
  basePath = "/shop",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(preserve)) {
      if (value) params.set(key, value);
    }
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass = (disabled: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm transition",
      disabled
        ? "pointer-events-none border-neutral-200 text-neutral-400"
        : "border-neutral-300 text-neutral-800 hover:border-brand-blue hover:text-brand-blue",
    );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
      <Link href={href(page - 1)} aria-disabled={page <= 1} className={linkClass(page <= 1)}>
        Previous
      </Link>
      <span className="text-sm text-neutral-600">
        Page {page} of {totalPages}
      </span>
      <Link
        href={href(page + 1)}
        aria-disabled={page >= totalPages}
        className={linkClass(page >= totalPages)}
      >
        Next
      </Link>
    </nav>
  );
}
