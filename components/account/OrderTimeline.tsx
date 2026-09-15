import type { TimelineStep, TimelineStepState } from "@/lib/account/order-timeline";
import { cn } from "@/lib/utils";

export type OrderTimelineProps = {
  steps: TimelineStep[];
};

const dotClasses: Record<TimelineStepState, string> = {
  done: "border-emerald-600 bg-emerald-600",
  current: "border-neutral-900 bg-white ring-4 ring-neutral-900/10",
  upcoming: "border-neutral-300 bg-white",
  cancelled: "border-rose-600 bg-rose-600",
};

const labelClasses: Record<TimelineStepState, string> = {
  done: "text-neutral-900",
  current: "text-neutral-900",
  upcoming: "text-neutral-400",
  cancelled: "text-rose-700",
};

/** Server Component: vertical progress list for an order. */
export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <ol className="relative space-y-6">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2",
                  dotClasses[step.state],
                )}
              />
              {!isLast && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-neutral-200" />}
            </div>
            <div className="pb-1">
              <p className={cn("text-sm font-medium", labelClasses[step.state])}>
                {step.label}
                {step.state === "current" && (
                  <span className="ml-2 text-xs font-normal text-neutral-500">In progress</span>
                )}
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">{step.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
