"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import type { BannerData } from "@/types/content";

const INTERVAL_MS = 6000;

export type HeroCarouselProps = {
  /** Active HERO banners from the admin, in sort order. */
  slides: BannerData[];
  /** Drives the gold "26+ years" medallion (store settings). 0 hides it. */
  yearsInBusiness: number;
  className?: string;
};

/**
 * Client Component: the hero banner. Slides auto-advance and pause while hovered; dots and
 * arrows change slides directly. The first slide's image loads with priority - it is the
 * largest thing above the fold. Renders nothing when no slide is active.
 */
export function HeroCarousel({ slides, yearsInBusiness, className }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;
  const current = Math.min(index, count - 1);
  const go = (next: number) => setIndex((next + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "relative h-[220px] overflow-hidden rounded-xl bg-neutral-100 sm:h-[280px] lg:h-[360px]",
        className,
      )}
    >
      {slides.map((slide, i) => {
        const active = i === current;
        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
            aria-hidden={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-700",
              active ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 1000px, 100vw"
              className="object-cover object-right"
            />
            {/* Soft white wash on the left keeps the copy legible over any photo. */}
            <div className="absolute inset-0 bg-linear-to-r from-white via-white/85 to-white/10 sm:to-transparent" />

            <div className="relative flex h-full max-w-[60%] flex-col justify-center gap-2.5 px-5 sm:max-w-[55%] sm:px-8 lg:gap-3.5 lg:px-10">
              {slide.eyebrow && (
                <span className="w-fit rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase sm:text-[11px]">
                  {slide.eyebrow}
                </span>
              )}
              <h1 className="text-xl leading-tight font-extrabold tracking-tight text-neutral-900 sm:text-3xl lg:text-[2.6rem]">
                {slide.title}
                {slide.titleAccent && (
                  <span className="text-brand-orange block">{slide.titleAccent}</span>
                )}
              </h1>
              {slide.description && (
                <p className="hidden text-sm text-neutral-600 sm:block lg:text-[15px]">
                  {slide.description}
                </p>
              )}
              {(slide.ctaHref || slide.secondaryHref) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                  {slide.ctaHref && slide.ctaLabel && (
                    <Link
                      href={slide.ctaHref}
                      tabIndex={active ? 0 : -1}
                      className="bg-brand-orange hover:bg-brand-orange-dark inline-flex h-9 items-center rounded-md px-4 text-xs font-semibold text-white transition sm:h-10 sm:px-5 sm:text-sm"
                    >
                      {slide.ctaLabel}
                    </Link>
                  )}
                  {slide.secondaryHref && slide.secondaryLabel && (
                    <Link
                      href={slide.secondaryHref}
                      tabIndex={active ? 0 : -1}
                      className="hidden h-10 items-center rounded-md border border-neutral-300 bg-white/80 px-5 text-sm font-semibold text-neutral-800 transition hover:border-neutral-900 sm:inline-flex"
                    >
                      {slide.secondaryLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {yearsInBusiness > 0 && (
        <div
          aria-label={`${yearsInBusiness}+ years of trusted service`}
          className="from-brand-gold to-brand-gold-dark text-brand-navy absolute top-4 right-4 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-linear-to-b text-center shadow-lg ring-4 ring-white/70 sm:top-6 sm:right-6 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
        >
          <span className="text-lg leading-none font-extrabold sm:text-2xl lg:text-3xl">
            {yearsInBusiness}+
          </span>
          <span className="mt-0.5 hidden text-[9px] leading-tight font-semibold uppercase sm:block lg:text-[10px]">
            Years of
            <br />
            Trusted Service
          </span>
        </div>
      )}

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Previous slide"
            className="absolute top-1/2 left-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow transition hover:bg-white lg:flex"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Next slide"
            className="absolute top-1/2 right-2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-700 shadow transition hover:bg-white lg:flex"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === current}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === current
                    ? "bg-brand-blue w-5"
                    : "w-2 bg-neutral-400/70 hover:bg-neutral-500",
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
