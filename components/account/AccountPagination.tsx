import Link from "next/link";
import { cn } from "@/lib/utils";

export type AccountPaginationProps = {
  page: number;
  totalPages: number;
  /** Path the page links point at, e.g. "/account/orders". */
  basePath: string;
};

/** Server Component: Previous / Next links for account list pages. */
export function AccountPagination({ page, totalPages, basePath }: AccountPaginationProps) {
  if (totalPages <= 1) return null;

  const href = (target: number) => (target > 1 ? `${basePath}?page=${target}` : basePath);

  const linkClass = (disabled: boolean) =>
    cn(
      "rounded-lg border px-3 py-1.5 text-sm",
      disabled
        ? "pointer-events-none border-neutral-200 text-neutral-400"
        : "border-neutral-300 text-neutral-800 hover:border-neutral-900",
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
