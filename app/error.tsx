"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

export type ErrorPageProps = {
  /** In production Next strips the message and attaches a `digest` for server-log correlation. */
  error: Error & { digest?: string };
  /** Re-renders the failed segment. */
  reset: () => void;
};

/**
 * Root error boundary (App Router `error.tsx`). Must be a Client Component.
 * Catches render errors below the root layout; errors thrown by the root layout itself need
 * `app/global-error.tsx`.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Client-side log for debugging; the server has already logged the full stack.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
      <Alert tone="danger" title="Something went wrong">
        <p>
          We hit an unexpected problem while loading this page. Your cart and account are safe. You
          can try again, or head back to the shop.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs opacity-80">Reference: {error.digest}</p>
        )}
      </Alert>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
