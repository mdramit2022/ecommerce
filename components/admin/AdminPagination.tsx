import Link from "next/link";
import { buildPath } from "@/lib/admin/search-params";
import { cn } from "@/lib/utils";
import type { Pagination } from "@/types/product";

export type AdminPaginationProps = {
  pagination: Pagination;
  /** Path the links point at, e.g. "/admin/products". */
  basePath: string;
  /** Filters to preserve across pages. */
  preserve?: Record<string, string | undefined>;
};

/** Server Component: page links for admin lists (the storefront Pagination only links to "/"). */
export function AdminPagination({ pagination, basePath, preserve = {} }: AdminPaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  const href = (target: number) =>
    buildPath(basePath, { ...preserve, page: target > 1 ? String(target) : undefined });

  const linkClass = (disabled: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm",
      disabled
        ? "pointer-events-none border-neutral-200 text-neutral-400"
        : "border-neutral-300 text-neutral-800 hover:border-neutral-900",
    );

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex flex-col items-center justify-between gap-3 text-sm text-neutral-600 sm:flex-row"
    >
      <p>
        Showing {from}-{to} of {total}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <Link href={href(page - 1)} aria-disabled={page <= 1} className={linkClass(page <= 1)}>
            Previous
          </Link>
          <span>
            Page {page} of {totalPages}
          </span>
          <Link
            href={href(page + 1)}
            aria-disabled={page >= totalPages}
            className={linkClass(page >= totalPages)}
          >
            Next
          </Link>
        </div>
      )}
    </nav>
  );
}
