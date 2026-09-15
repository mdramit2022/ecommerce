import type { LabelHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export function Label({ className, children, required, ...rest }: LabelProps) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-neutral-800", className)} {...rest}>
      {children}
      {required && (
        <span aria-hidden="true" className="ml-0.5 text-rose-600">
          *
        </span>
      )}
    </label>
  );
}

export type FieldProps = {
  id: string;
  label: ReactNode;
  required?: boolean;
  error?: string | string[];
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Label + control + error message wrapper. Pass the control as children with matching `id`. */
export function Field({ id, label, required, error, hint, children, className }: FieldProps) {
  const errors = Array.isArray(error) ? error : error ? [error] : [];
  return (
    <div className={cn("flex flex-col", className)}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children}
      {hint && errors.length === 0 && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
      {errors.length > 0 && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-rose-600">
          {errors[0]}
        </p>
      )}
    </div>
  );
}
