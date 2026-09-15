"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type AuthFormState } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";

export type RegisterFormProps = {
  /** Safe, same-site path to land on after the account is created and signed in. */
  callbackUrl: string;
};

const initialState: AuthFormState = {};

export function RegisterForm({ callbackUrl }: RegisterFormProps) {
  const [state, formAction, isPending] = useActionState(registerAction, initialState);

  const nameError = state.fieldErrors?.name;
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;
  const confirmError = state.fieldErrors?.confirmPassword;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <Field id="name" label="Full name" required error={nameError}>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          defaultValue={state.values?.name ?? ""}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "name-error" : undefined}
          disabled={isPending}
        />
      </Field>

      <Field id="email" label="Email" required error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.values?.email ?? ""}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          disabled={isPending}
        />
      </Field>

      <Field
        id="password"
        label="Password"
        required
        error={passwordError}
        hint="At least 8 characters, including a letter and a number."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          disabled={isPending}
        />
      </Field>

      <Field id="confirmPassword" label="Confirm password" required error={confirmError}>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? "confirmPassword-error" : undefined}
          disabled={isPending}
        />
      </Field>

      <Button type="submit" loading={isPending} className="mt-2 w-full">
        {isPending ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-neutral-900 underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
