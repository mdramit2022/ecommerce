export default function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-neutral-200" />

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-3">
          <div className="aspect-square w-full animate-pulse rounded-xl bg-neutral-200" />
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-neutral-200" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
          <div className="h-9 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-neutral-200" />
          <div className="h-9 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-neutral-200" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-11/12 animate-pulse rounded bg-neutral-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
          </div>
          <div className="h-11 w-48 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-6 h-7 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <div className="aspect-square animate-pulse bg-neutral-200" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-6 h-7 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-200" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
