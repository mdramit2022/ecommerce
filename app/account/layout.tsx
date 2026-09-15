import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AccountNav } from "@/components/account/AccountNav";

export const metadata: Metadata = {
  title: { default: "Account", template: "%s | Account | Ecommerce" },
};

/**
 * Account area shell. Middleware already requires a session for /account/**, but the
 * layout re-checks so a direct render (e.g. misconfigured matcher) can never leak data.
 */
export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in?callbackUrl=/account");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="shrink-0 lg:w-56">
          <p className="mb-3 px-3 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            My account
          </p>
          <AccountNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
