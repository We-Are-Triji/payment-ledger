export function SkeletonUsers() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 animate-page-enter">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-6 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-8 w-20 rounded-md" />
          <div className="skeleton h-8 w-16 rounded-md" />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        <div className="skeleton h-8 w-16 rounded-md" />
        <div className="skeleton h-8 w-20 rounded-md" />
        <div className="skeleton h-8 w-24 rounded-md" />
      </div>

      {/* User cards */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-20" />
            </div>
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
