import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Middleware already redirects non-admins, but authorisation is re-checked here
 * server-side (UI hiding is not authorisation - CLAUDE.md section 7).
 */
export default async function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") redirect("/");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:gap-10 lg:px-8">
      <aside className="md:w-52 md:shrink-0">
        <p className="mb-3 hidden text-xs font-semibold tracking-wide text-neutral-400 uppercase md:block">
          Admin
        </p>
        <AdminNav />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
