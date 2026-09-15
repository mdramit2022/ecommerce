export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="mb-8 h-8 w-48 rounded-lg bg-neutral-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-xl border border-neutral-200 bg-white" />
        ))}
      </div>
      <div className="mt-8 h-64 rounded-xl border border-neutral-200 bg-white" />
    </div>
  );
}
