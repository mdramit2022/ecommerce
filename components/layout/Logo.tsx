import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type LogoProps = {
  /** `color` on white chrome, `light` on the navy footer. */
  tone?: "color" | "light";
  /** Hide the tagline (phone header). */
  compact?: boolean;
  className?: string;
};

/** Red house with a white shopping basket - the store mark. Colour via className. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" className={className}>
      <path d="M24 5 4.5 20.5V41a3 3 0 0 0 3 3h33a3 3 0 0 0 3-3V20.5L24 5Z" fill="currentColor" />
      <path
        d="M16.5 24.5h15l-1.6 11.2a2 2 0 0 1-2 1.8H20.1a2 2 0 0 1-2-1.8l-1.6-11.2Z"
        fill="#fff"
      />
      <path
        d="M20 24.5v-2.3a4 4 0 0 1 8 0v2.3"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M20.5 29.5h7M21.2 33h5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Server-safe wordmark + mark. The two name lines sit tight, with no gap between them. */
export function Logo({ tone = "color", compact = false, className }: LogoProps) {
  const light = tone === "light";
  return (
    <Link
      href="/"
      aria-label={`${BRAND.name} - home`}
      className={cn("inline-flex items-center gap-2", className)}
    >
      <LogoMark className={cn("h-10 w-10 shrink-0", light ? "text-white" : "text-brand-red")} />
      <span className="flex flex-col">
        <span
          className={cn(
            "text-[22px] leading-none font-extrabold tracking-tight",
            light ? "text-white" : "text-brand-red",
          )}
        >
          {BRAND.nameAccent}
        </span>
        <span
          className={cn(
            "-mt-0.5 text-[15px] leading-none font-bold tracking-tight",
            light ? "text-white/90" : "text-brand-blue",
          )}
        >
          {BRAND.nameRest}
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[10px] leading-none font-medium",
              light ? "text-white/60" : "text-neutral-500",
            )}
          >
            {BRAND.tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
