import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  children?: ReactNode;
};

/** Server Component: a single KPI tile for the dashboard. */
export function StatCard({ label, value, hint, children }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      {children}
    </Card>
  );
}
