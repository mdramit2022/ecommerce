"use client";

import Image from "next/image";
import { useState } from "react";
import { Stars } from "@/components/reviews/Stars";
import { TESTIMONIALS } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Client Component: one testimonial at a time, dots switch between them. */
export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);
  const current = TESTIMONIALS[index] ?? TESTIMONIALS[0];
  if (!current) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex flex-1 gap-4">
        <span className="ring-brand-blue-light relative h-16 w-16 shrink-0 overflow-hidden rounded-full ring-2">
          <Image src={current.avatar} alt="" fill sizes="64px" className="object-cover" />
        </span>
        <blockquote className="flex flex-1 flex-col">
          <p className="text-[13px] leading-relaxed text-neutral-700">
            &ldquo;{current.quote}&rdquo;
          </p>
          <footer className="mt-3 flex items-center justify-between gap-3">
            <Stars rating={current.rating} size="sm" />
            <cite className="text-xs text-neutral-500 not-italic">
              - {current.name}, {current.location}
            </cite>
          </footer>
        </blockquote>
      </div>

      {TESTIMONIALS.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {TESTIMONIALS.map((testimonial, i) => (
            <button
              key={testimonial.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show testimonial from ${testimonial.name}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "bg-brand-blue w-4" : "w-1.5 bg-neutral-300 hover:bg-neutral-400",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
