import { LoadMoreReviews } from "@/components/reviews/LoadMoreReviews";
import { ReviewItem } from "@/components/reviews/ReviewItem";
import { EmptyState } from "@/components/ui/Card";
import type { ReviewData } from "@/types/review";

export type ReviewListProps = {
  productId: string;
  /** First page, newest first. */
  reviews: ReviewData[];
  total: number;
  pageSize: number;
  currentUserId?: string | null;
};

/** Server Component: renders the first page and hands further pages to a client "Load more". */
export function ReviewList({
  productId,
  reviews,
  total,
  pageSize,
  currentUserId = null,
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Be the first to share your thoughts about this product."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4" aria-label="Reviews">
        {reviews.map((review) => (
          <ReviewItem key={review.id} review={review} isOwn={review.userId === currentUserId} />
        ))}
      </ul>
      {total > reviews.length && (
        <LoadMoreReviews
          productId={productId}
          initialCount={reviews.length}
          total={total}
          pageSize={pageSize}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}
