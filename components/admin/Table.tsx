import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Server-safe table primitives for admin lists (horizontal scroll on narrow screens). */

export type TableProps = HTMLAttributes<HTMLTableElement> & { children: ReactNode };

export function Table({ className, children, ...rest }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
      <table className={cn("w-full text-left text-sm", className)} {...rest}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="border-b border-neutral-200 bg-neutral-50">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-neutral-100">{children}</tbody>;
}

export type ThProps = ThHTMLAttributes<HTMLTableCellElement>;

export function Th({ className, children, ...rest }: ThProps) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export type TdProps = TdHTMLAttributes<HTMLTableCellElement>;

export function Td({ className, children, ...rest }: TdProps) {
  return (
    <td className={cn("px-4 py-3 align-middle text-neutral-800", className)} {...rest}>
      {children}
    </td>
  );
}

export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-neutral-500">
        {children}
      </td>
    </tr>
  );
}
