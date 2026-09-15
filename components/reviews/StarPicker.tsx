"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StarIcon } from "@/components/reviews/StarIcon";
import type { ReviewRating } from "@/types/review";

export type StarPickerProps = {
  /** Shared `name` for the radio group. */
  name: string;
  value: ReviewRating | null;
  onChange: (rating: ReviewRating) => void;
  disabled?: boolean;
  error?: string;
};

const RATINGS: readonly ReviewRating[] = [1, 2, 3, 4, 5];

const RATING_LABELS: Record<ReviewRating, string> = {
  1: "Terrible",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};

/**
 * Client Component: 1-5 star picker built on native radio buttons, so it is keyboard
 * accessible out of the box (Tab into the group, arrow keys to change the value).
 */
export function StarPicker({ name, value, onChange, disabled = false, error }: StarPickerProps) {
  const [hovered, setHovered] = useState<ReviewRating | null>(null);
  const display = hovered ?? value;
  const errorId = `${name}-error`;

  return (
    <fieldset
      disabled={disabled}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      className="min-w-0"
    >
      <legend className="mb-1.5 block text-sm font-medium text-neutral-800">
        Your rating
        <span aria-hidden="true" className="ml-0.5 text-rose-600">
          *
        </span>
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center" onMouseLeave={() => setHovered(null)}>
          {RATINGS.map((rating) => {
            const label = `${rating} star${rating === 1 ? "" : "s"} - ${RATING_LABELS[rating]}`;
            return (
              <label
                key={rating}
                className={cn("relative p-0.5", disabled ? "cursor-not-allowed" : "cursor-pointer")}
                onMouseEnter={() => setHovered(rating)}
              >
                <input
                  type="radio"
                  name={name}
                  value={rating}
                  checked={value === rating}
                  onChange={() => onChange(rating)}
                  aria-label={label}
                  className="peer sr-only"
                />
                <StarIcon
                  className={cn(
                    "h-8 w-8 rounded transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-neutral-900",
                    display !== null && rating <= display ? "text-amber-400" : "text-neutral-300",
                    !disabled && "hover:scale-110",
                  )}
                />
              </label>
            );
          })}
        </div>
        <span className="text-sm text-neutral-600" aria-live="polite">
          {display !== null ? RATING_LABELS[display] : "Select a rating"}
        </span>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
