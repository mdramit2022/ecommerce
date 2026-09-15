import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { listNavCategoriesSafe } from "@/lib/catalog/categories";
import { SITE_DESCRIPTION } from "@/lib/seo/site";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { CategoryNav } from "@/components/layout/CategoryNav";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartSync } from "@/components/cart/CartSync";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
  description: SITE_DESCRIPTION,
};

/**
 * Root layout: announcement bar, header, desktop category nav, page, footer and the phone tab
 * bar. Reads the session once and the category list once (cached per request) for the shell.
 */
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, categories] = await Promise.all([auth(), listNavCategoriesSafe()]);
  const user = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        isAdmin: session.user.role === "ADMIN",
      }
    : null;

  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-brand-surface min-h-screen font-sans text-neutral-900 antialiased">
        <AnnouncementBar />
        <SiteHeader categories={categories} user={user} />
        <CategoryNav categories={categories} />
        <CartSync userId={session?.user?.id ?? null} />
        {/* Bottom padding keeps content clear of the fixed phone tab bar. */}
        <div className="pb-16 md:pb-0">{children}</div>
        <SiteFooter />
        <MobileTabBar />
      </body>
    </html>
  );
}
