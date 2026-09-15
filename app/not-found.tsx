import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const suggestions = [
  { href: "/", label: "Browse the shop", description: "See everything currently in stock." },
  { href: "/cart", label: "Review your cart", description: "Your items are saved on this device." },
  {
    href: "/account/orders",
    label: "Track an order",
    description: "Sign in to see order status and history.",
  },
];

/** Root 404 page. Rendered inside the root layout, so the header and footer stay in place. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
        We could not find that page
      </h1>
      <p className="mt-4 max-w-md text-neutral-600">
        The link may be out of date, or the product may no longer be available. Here are a few
        places to pick up where you left off.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Continue shopping
        </Link>
        <Link
          href="/cart"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:border-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          View cart
        </Link>
      </div>

      <nav aria-label="Suggested pages" className="mt-14 w-full">
        <ul className="grid gap-4 text-left sm:grid-cols-3">
          {suggestions.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block h-full rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-900 hover:shadow-md"
              >
                <span className="block text-sm font-semibold text-neutral-900">{item.label}</span>
                <span className="mt-1 block text-sm text-neutral-500">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
