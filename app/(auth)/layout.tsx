import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

/**
 * Narrow, centred shell shared by /sign-in and /register.
 * The site header and footer come from the root layout.
 */
export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-6 self-center text-xl font-semibold tracking-tight text-neutral-900"
      >
        Ecommerce
      </Link>
      <Card className="p-6 sm:p-8">{children}</Card>
    </main>
  );
}
