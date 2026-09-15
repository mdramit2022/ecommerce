import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { authErrorMessage, resolveCallbackUrl } from "@/lib/users/auth-redirect";
import { Alert } from "@/components/ui/Alert";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInForm } from "@/components/auth/GoogleSignInForm";

export const metadata: Metadata = { title: "Create account" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(first(params.callbackUrl), "/account");

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  const errorMessage = authErrorMessage(first(params.error));
  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Create account</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Track orders, save addresses and check out faster.
        </p>
      </div>

      {errorMessage && (
        <Alert tone="danger" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <RegisterForm callbackUrl={callbackUrl} />

      {googleEnabled && <GoogleSignInForm callbackUrl={callbackUrl} />}
    </>
  );
}
