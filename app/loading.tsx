export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true">
      <div className="mb-8 h-8 w-32 rounded bg-neutral-200" />
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-xl border border-neutral-200 bg-white"
          >
            <div className="aspect-square bg-neutral-200" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-1/3 rounded bg-neutral-200" />
              <div className="h-4 w-3/4 rounded bg-neutral-200" />
              <div className="h-4 w-1/4 rounded bg-neutral-200" />
              <div className="mt-2 h-9 rounded-lg bg-neutral-200" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
