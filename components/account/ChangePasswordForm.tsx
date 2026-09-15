"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { initialActionState } from "@/lib/account/action-state";
import { changePassword } from "@/app/account/profile/actions";

/** Client Component: change password form. Passwords are never echoed back into the form. */
export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialActionState);
  const errorOf = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <Field
        id="currentPassword"
        label="Current password"
        required
        error={errorOf("currentPassword")}
      >
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errorOf("currentPassword")) || undefined}
        />
      </Field>

      <Field
        id="newPassword"
        label="New password"
        required
        error={errorOf("newPassword")}
        hint="At least 8 characters with a letter and a number."
      >
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(errorOf("newPassword")) || undefined}
        />
      </Field>

      <Field
        id="confirmPassword"
        label="Confirm new password"
        required
        error={errorOf("confirmPassword")}
      >
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={Boolean(errorOf("confirmPassword")) || undefined}
        />
      </Field>

      <Button type="submit" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
