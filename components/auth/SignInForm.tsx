"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { signInAction, type AuthFormState } from "@/app/(auth)/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";

export type SignInFormProps = {
  /** Safe, same-site path to land on after signing in. */
  callbackUrl: string;
  /** Show the seeded demo credentials (never true in production). */
  showDemoHint?: boolean;
};

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@example.com", password: "Admin123!" },
  { label: "Customer", email: "customer@example.com", password: "Customer123!" },
] as const;

const initialState: AuthFormState = {};

export function SignInForm({ callbackUrl, showDemoHint = false }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  function fillDemo(email: string, password: string) {
    const form = formRef.current;
    if (!form) return;
    const emailInput = form.elements.namedItem("email");
    const passwordInput = form.elements.namedItem("password");
    if (emailInput instanceof HTMLInputElement) emailInput.value = email;
    if (passwordInput instanceof HTMLInputElement) passwordInput.value = password;
  }

  return (
    <form ref={formRef} action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      {state.error && <Alert tone="danger">{state.error}</Alert>}

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

      <Field id="password" label="Password" required error={passwordError}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "password-error" : undefined}
          disabled={isPending}
        />
      </Field>

      <Button type="submit" loading={isPending} className="mt-2 w-full">
        {isPending ? "Signing in..." : "Sign in"}
      </Button>

      {showDemoHint && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3 text-xs text-neutral-600">
          <p className="mb-2 font-medium text-neutral-800">Demo accounts (development only)</p>
          <ul className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="flex items-center justify-between gap-2">
                <span className="font-mono">
                  {account.email} / {account.password}
                </span>
                <button
                  type="button"
                  onClick={() => fillDemo(account.email, account.password)}
                  className="shrink-0 rounded px-1.5 py-0.5 font-medium text-neutral-700 underline-offset-2 hover:bg-neutral-200 hover:underline"
                >
                  Use {account.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-sm text-neutral-600">
        New here?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-neutral-900 underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
