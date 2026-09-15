"use client";

import { useState } from "react";
import { ReviewItem } from "@/components/reviews/ReviewItem";
import { Button } from "@/components/ui/Button";
import type { PaginatedResponse } from "@/types/product";
import type { ReviewData } from "@/types/review";

export type LoadMoreReviewsProps = {
  productId: string;
  /** Reviews already rendered by the server. */
  initialCount: number;
  total: number;
  pageSize: number;
  currentUserId?: string | null;
};

function isReviewListResponse(body: unknown): body is PaginatedResponse<ReviewData> {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as { data?: unknown; pagination?: unknown };
  return Array.isArray(candidate.data) && typeof candidate.pagination === "object";
}

/**
 * Client Component: appends further pages from GET /api/products/[id]/reviews
 * below the server-rendered first page.
 */
export function LoadMoreReviews({
  productId,
  initialCount,
  total,
  pageSize,
  currentUserId = null,
}: LoadMoreReviewsProps) {
  const [extra, setExtra] = useState<ReviewData[]>([]);
  const [nextPage, setNextPage] = useState(Math.floor(initialCount / pageSize) + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, total - initialCount - extra.length);

  const loadMore = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(nextPage), limit: String(pageSize) });
      const response = await fetch(`/api/products/${productId}/reviews?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok || !isReviewListResponse(body)) {
        throw new Error("Failed to load reviews");
      }
      setExtra((current) => {
        const seen = new Set(current.map((review) => review.id));
        return [...current, ...body.data.filter((review) => !seen.has(review.id))];
      });
      setNextPage((page) => page + 1);
    } catch {
      setError("Could not load more reviews. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {extra.length > 0 && (
        <ul className="flex flex-col gap-4" aria-label="More reviews">
          {extra.map((review) => (
            <ReviewItem key={review.id} review={review} isOwn={review.userId === currentUserId} />
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {remaining > 0 && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMore} loading={loading}>
            Load more reviews ({remaining} remaining)
          </Button>
        </div>
      )}
    </>
  );
}
