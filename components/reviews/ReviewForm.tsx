"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { StarPicker } from "@/components/reviews/StarPicker";
import { Stars } from "@/components/reviews/Stars";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import type { ReviewRating } from "@/types/review";

export type ReviewFormExistingReview = {
  id: string;
  rating: number;
  comment: string | null;
};

export type ReviewFormProps = {
  productId: string;
  productSlug: string;
  /** When false a sign-in link is rendered instead of the form. */
  isSignedIn: boolean;
  /** Signed in and has not reviewed this product yet. */
  canReview: boolean;
  /** The signed-in user's existing review, if any (enables edit / delete). */
  existingReview?: ReviewFormExistingReview | null;
};

type FieldErrors = { rating?: string; comment?: string };

type ApiErrorBody = { error: string; issues?: { path?: unknown; message?: unknown }[] };

const COMMENT_MAX = 2000;

function isApiErrorBody(body: unknown): body is ApiErrorBody {
  return (
    typeof body === "object" &&
    body !== null &&
    typeof (body as { error?: unknown }).error === "string"
  );
}

function fieldErrorsFromIssues(body: ApiErrorBody): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of body.issues ?? []) {
    const key = Array.isArray(issue.path) ? issue.path[0] : undefined;
    const message = typeof issue.message === "string" ? issue.message : "Invalid value";
    if (key === "rating" && !errors.rating) errors.rating = message;
    if (key === "comment" && !errors.comment) errors.comment = message;
  }
  return errors;
}

function toRating(value: number | undefined): ReviewRating | null {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : null;
}

/**
 * Client Component: write / edit / delete the current user's review.
 * POSTs to /api/products/[id]/reviews (upsert) and refreshes the server-rendered page on success.
 */
export function ReviewForm({
  productId,
  productSlug,
  isSignedIn,
  canReview,
  existingReview = null,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState<ReviewRating | null>(toRating(existingReview?.rating));
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<"idle" | "saving" | "deleting">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [success, setSuccess] = useState<string | null>(null);

  const signInHref = `/sign-in?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`;

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-neutral-900">Share your thoughts</h3>
        <p className="mt-1 text-sm text-neutral-500">Sign in to write a review for this product.</p>
        <Link
          href={signInHref}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Sign in to review
        </Link>
      </div>
    );
  }

  const busy = pending !== "idle";
  const showForm = canReview || editing;

  const resetToExisting = () => {
    setRating(toRating(existingReview?.rating));
    setComment(existingReview?.comment ?? "");
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (rating === null) {
      setFieldErrors({ rating: "Please select a star rating" });
      return;
    }
    const trimmed = comment.trim();
    if (trimmed.length > COMMENT_MAX) {
      setFieldErrors({ comment: `Comment must be ${COMMENT_MAX} characters or fewer` });
      return;
    }

    setFieldErrors({});
    setPending("saving");
    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ rating, comment: trimmed }),
      });
      const body: unknown = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push(signInHref);
        return;
      }
      if (!response.ok) {
        if (isApiErrorBody(body)) {
          setFieldErrors(fieldErrorsFromIssues(body));
          setFormError(body.error);
        } else {
          setFormError("Could not save your review. Please try again.");
        }
        return;
      }

      setSuccess(existingReview ? "Your review was updated." : "Thanks for your review!");
      setEditing(false);
      router.refresh();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setPending("idle");
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!window.confirm("Delete your review? This cannot be undone.")) return;

    setFormError(null);
    setSuccess(null);
    setPending("deleting");
    try {
      const response = await fetch(`/api/reviews/${existingReview.id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" },
      });
      if (response.status === 401) {
        router.push(signInHref);
        return;
      }
      if (!response.ok && response.status !== 404) {
        const body: unknown = await response.json().catch(() => null);
        setFormError(isApiErrorBody(body) ? body.error : "Could not delete your review.");
        return;
      }
      setRating(null);
      setComment("");
      setEditing(false);
      setSuccess("Your review was deleted.");
      router.refresh();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setPending("idle");
    }
  };

  if (existingReview && !showForm) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-neutral-900">Your review</h3>
        <Stars rating={existingReview.rating} size="sm" className="mt-2" />
        {existingReview.comment ? (
          <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-line text-neutral-700">
            {existingReview.comment}
          </p>
        ) : (
          <p className="mt-3 text-sm text-neutral-400 italic">No written comment.</p>
        )}
        {success && (
          <Alert tone="success" className="mt-4">
            {success}
          </Alert>
        )}
        {formError && (
          <Alert tone="danger" className="mt-4">
            {formError}
          </Alert>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setSuccess(null);
              setFormError(null);
              setEditing(true);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            loading={pending === "deleting"}
            disabled={busy}
            onClick={handleDelete}
            className="text-rose-600 hover:bg-rose-50"
          >
            Delete
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="text-base font-semibold text-neutral-900">
          {existingReview ? "Edit your review" : "Write a review"}
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          {existingReview
            ? "Update your rating or comment."
            : "Tell other shoppers what you think of this product."}
        </p>
      </div>

      <StarPicker
        name="rating"
        value={rating}
        disabled={busy}
        error={fieldErrors.rating}
        onChange={(next) => {
          setRating(next);
          setFieldErrors((current) => ({ ...current, rating: undefined }));
        }}
      />

      <Field
        id="review-comment"
        label="Comment"
        hint={`${comment.length}/${COMMENT_MAX} characters (optional)`}
        error={fieldErrors.comment}
      >
        <Textarea
          id="review-comment"
          name="comment"
          rows={4}
          value={comment}
          maxLength={COMMENT_MAX}
          placeholder="What did you like or dislike? How did you use it?"
          disabled={busy}
          aria-invalid={fieldErrors.comment ? true : undefined}
          aria-describedby={fieldErrors.comment ? "review-comment-error" : undefined}
          onChange={(event) => {
            setComment(event.target.value);
            setFieldErrors((current) => ({ ...current, comment: undefined }));
          }}
        />
      </Field>

      {formError && <Alert tone="danger">{formError}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending === "saving"} disabled={busy}>
          {existingReview ? "Save changes" : "Submit review"}
        </Button>
        {existingReview && (
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => {
              resetToExisting();
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
