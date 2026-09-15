import type { SVGProps } from "react";

export type StarIconProps = SVGProps<SVGSVGElement>;

/** Filled five-point star. Colour comes from `currentColor`; size from className. */
export function StarIcon(props: StarIconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z" />
    </svg>
  );
}
