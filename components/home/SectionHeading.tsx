import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/ui/Icon";

export type SectionHeadingProps = {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  viewAll?: { label?: string; href: string };
};

/** Server Component. Icon + title + subtitle on the left, "View All" on the right. */
export function SectionHeading({ id, icon, title, subtitle, viewAll }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-brand-orange mt-0.5">
          {icon}
        </span>
        <div>
          <h2 id={id} className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-neutral-500 sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {viewAll && (
        <Link
          href={viewAll.href}
          className="text-brand-blue flex shrink-0 items-center gap-1 text-xs font-semibold hover:underline sm:text-sm"
        >
          {viewAll.label ?? "View All"}
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
