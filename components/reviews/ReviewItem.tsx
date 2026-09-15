import Image from "next/image";
import { formatReviewDate, reviewerDisplayName } from "@/lib/reviews/format";
import { Stars } from "@/components/reviews/Stars";
import { Badge } from "@/components/ui/Badge";
import type { ReviewData } from "@/types/review";

export type ReviewItemProps = {
  review: ReviewData;
  /** Highlights the review written by the current viewer. */
  isOwn?: boolean;
};

/** Only optimise avatars we can actually load through next/image. */
function isRenderableImage(src: string | null): src is string {
  return typeof src === "string" && (src.startsWith("https://") || src.startsWith("/"));
}

/** Presentational (no hooks) - usable from Server and Client Components. */
export function ReviewItem({ review, isOwn = false }: ReviewItemProps) {
  const name = reviewerDisplayName(review.author.name);
  const initial = name.charAt(0).toUpperCase();

  return (
    <li className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="shrink-0">
        {isRenderableImage(review.author.image) ? (
          <Image
            src={review.author.image}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700"
          >
            {initial}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-medium text-neutral-900">{name}</p>
          {isOwn && <Badge tone="info">Your review</Badge>}
          <time dateTime={review.createdAt} className="text-xs text-neutral-500">
            {formatReviewDate(review.createdAt)}
          </time>
        </div>
        <Stars rating={review.rating} size="sm" className="mt-1" />
        {review.comment ? (
          <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-neutral-700">
            {review.comment}
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-400 italic">No written comment.</p>
        )}
      </div>
    </li>
  );
}
