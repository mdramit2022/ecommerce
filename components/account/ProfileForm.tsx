"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { initialActionState } from "@/lib/account/action-state";
import { updateProfile } from "@/app/account/profile/actions";

export type ProfileFormProps = {
  initialName: string;
  email: string;
};

/** Client Component: edit display name (email is read-only). */
export function ProfileForm({ initialName, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfile, initialActionState);
  const nameError = state.fieldErrors?.name;

  return (
    <form action={formAction} noValidate className="space-y-5">
      {state.status === "error" && state.message && <Alert tone="danger">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}

      <Field id="email" label="Email" hint="Contact support to change your email address.">
        <Input id="email" name="email" type="email" value={email} disabled readOnly />
      </Field>

      <Field id="name" label="Name" required error={nameError}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={state.values?.name ?? initialName}
          aria-invalid={Boolean(nameError) || undefined}
        />
      </Field>

      <Button type="submit" loading={pending}>
        Save changes
      </Button>
    </form>
  );
}
