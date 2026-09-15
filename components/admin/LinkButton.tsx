import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type LinkButtonProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
};

const variantClasses: Record<NonNullable<LinkButtonProps["variant"]>, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  outline: "border border-neutral-300 bg-white text-neutral-900 hover:border-neutral-900",
  ghost: "text-neutral-700 hover:bg-neutral-100",
};

const sizeClasses: Record<NonNullable<LinkButtonProps["size"]>, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

/** Server-safe anchor styled like <Button /> (navigation, not form submission). */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
