import { cn } from "@/lib/utils";
import { StarIcon } from "@/components/reviews/StarIcon";

export type StarsSize = "sm" | "md" | "lg";

export type StarsProps = {
  /** 0..5, fractions allowed (e.g. an average of 4.3). */
  rating: number;
  size?: StarsSize;
  className?: string;
};

const sizeClasses: Record<StarsSize, string> = {
  sm: "h-4",
  md: "h-5",
  lg: "h-7",
};

const STAR_INDEXES = [0, 1, 2, 3, 4] as const;

/**
 * Read-only star display. Works in Server and Client Components (no hooks).
 * A clipped amber layer over grey stars renders fractional ratings precisely.
 */
export function Stars({ rating, size = "md", className }: StarsProps) {
  const clamped = Math.min(5, Math.max(0, Number.isFinite(rating) ? rating : 0));
  const percent = (clamped / 5) * 100;

  const row = (
    <>
      {STAR_INDEXES.map((index) => (
        <StarIcon key={index} className="h-full w-auto shrink-0" />
      ))}
    </>
  );

  return (
    <span
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
      className={cn("relative inline-flex shrink-0", sizeClasses[size], className)}
    >
      <span className="flex h-full text-neutral-300" aria-hidden="true">
        {row}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex h-full overflow-hidden text-amber-400"
        style={{ width: `${percent}%` }} // dynamic value - fractional fill
        aria-hidden="true"
      >
        {row}
      </span>
    </span>
  );
}
