import { pluralizeReviews } from "@/lib/reviews/format";
import { Stars } from "@/components/reviews/Stars";
import type { RatingSummary as RatingSummaryData, ReviewRating } from "@/types/review";

export type RatingSummaryProps = {
  summary: RatingSummaryData;
};

const RATING_ROWS: readonly ReviewRating[] = [5, 4, 3, 2, 1];

/** Server Component: average, count and per-star distribution bars. */
export function RatingSummary({ summary }: RatingSummaryProps) {
  const { average, count, distribution } = summary;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-3">
        <p className="text-4xl font-semibold tracking-tight text-neutral-900">
          {count > 0 ? average.toFixed(1) : "-"}
        </p>
        <div className="flex flex-col gap-1 pb-1">
          <Stars rating={average} size="sm" />
          <p className="text-xs text-neutral-500">
            {count > 0 ? `Based on ${pluralizeReviews(count)}` : "No reviews yet"}
          </p>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2">
        {RATING_ROWS.map((star) => {
          const rowCount = distribution[star];
          const percent = count > 0 ? Math.round((rowCount / count) * 100) : 0;
          const label = `${star} star${star === 1 ? "" : "s"}`;
          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <dt className="w-12 shrink-0 text-neutral-600">{label}</dt>
              <dd className="flex flex-1 items-center gap-3">
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={percent}
                  aria-label={`${percent}% of reviews are ${label}`}
                >
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${percent}%` }} // dynamic value - bar length
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-neutral-600 tabular-nums">
                  {rowCount}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
