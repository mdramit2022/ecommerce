import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you have saved for later.",
  robots: { index: false, follow: false },
};

/**
 * Server Component shell. The wishlist itself lives in the browser (persisted Zustand store), so
 * this page only provides the heading and renders the client view.
 */
export default function WishlistPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Your wishlist"
        description="Saved on this device. Add items to your cart when you are ready."
      />
      <WishlistView />
    </main>
  );
}
