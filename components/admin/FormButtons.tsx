"use client";

import type { MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

/** Submit button that shows a spinner while the enclosing form's Server Action is pending. */
export function SubmitButton({ children, loading, ...rest }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button {...rest} type="submit" loading={loading || pending}>
      {children}
    </Button>
  );
}

export type ConfirmSubmitButtonProps = ButtonProps & {
  /** Shown in a native confirm() dialog; the submit is cancelled when the admin declines. */
  confirmMessage: string;
};

/** Submit button guarded by a confirmation dialog (delete, role changes, ...). */
export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  children,
  loading,
  ...rest
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(confirmMessage)) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <Button {...rest} type="submit" loading={loading || pending} onClick={handleClick}>
      {children}
    </Button>
  );
}
