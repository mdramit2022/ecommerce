"use client";

import Image from "next/image";
import { useState } from "react";
import { Stars } from "@/components/reviews/Stars";
import { cn } from "@/lib/utils";
import type { TestimonialData } from "@/types/content";

export type TestimonialCarouselProps = {
  /** Active testimonials in sort order. */
  testimonials: TestimonialData[];
};

/** Client Component: one testimonial at a time, dots switch between them. */
export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [index, setIndex] = useState(0);
  const current = testimonials[Math.min(index, testimonials.length - 1)];
  if (!current) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-1 gap-4">
        <span className="bg-brand-blue-light text-brand-blue ring-brand-blue-light relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-bold ring-2">
          {current.avatar ? (
            <Image src={current.avatar} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            current.authorName.charAt(0)
          )}
        </span>
        <blockquote className="flex flex-1 flex-col">
          <p className="text-[13px] leading-relaxed text-neutral-700">
            &ldquo;{current.quote}&rdquo;
          </p>
          <footer className="mt-3 flex items-center justify-between gap-3">
            <Stars rating={current.rating} size="sm" />
            <cite className="text-xs text-neutral-500 not-italic">
              - {current.authorName}
              {current.location ? `, ${current.location}` : ""}
            </cite>
          </footer>
        </blockquote>
      </div>

      {testimonials.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {testimonials.map((testimonial, i) => (
            <button
              key={testimonial.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show testimonial from ${testimonial.authorName}`}
              aria-current={testimonial.id === current.id}
              className={cn(
                "h-1.5 rounded-full transition-all",
                testimonial.id === current.id
                  ? "bg-brand-blue w-4"
                  : "w-1.5 bg-neutral-300 hover:bg-neutral-400",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
