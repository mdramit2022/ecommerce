import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-neutral-300 p-12 text-center">
        <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          Product not found
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          This product may have been removed or is no longer available.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
        >
          Back to the shop
        </Link>
      </div>
    </main>
  );
}
