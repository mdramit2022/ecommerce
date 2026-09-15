import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { authErrorMessage, resolveCallbackUrl } from "@/lib/users/auth-redirect";
import { Alert } from "@/components/ui/Alert";
import { SignInForm } from "@/components/auth/SignInForm";
import { GoogleSignInForm } from "@/components/auth/GoogleSignInForm";

export const metadata: Metadata = { title: "Sign in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const callbackUrl = resolveCallbackUrl(first(params.callbackUrl), "/account");

  const session = await auth();
  if (session?.user) redirect(callbackUrl);

  const errorMessage = authErrorMessage(first(params.error));
  const showDemoHint = process.env.NODE_ENV !== "production";
  const googleEnabled = Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Welcome back. Enter your details to continue.
        </p>
      </div>

      {errorMessage && (
        <Alert tone="danger" className="mb-4">
          {errorMessage}
        </Alert>
      )}

      <SignInForm callbackUrl={callbackUrl} showDemoHint={showDemoHint} />

      {googleEnabled && <GoogleSignInForm callbackUrl={callbackUrl} />}
    </>
  );
}
