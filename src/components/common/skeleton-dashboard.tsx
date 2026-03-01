export function SkeletonDashboard() {
  return (
    <div className="mx-auto max-w-lg space-y-3 p-4 animate-page-enter">
      {/* Heading */}
      <div className="skeleton h-6 w-28" />

      {/* Monthly Summary card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="skeleton h-4 w-36" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-10 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Progress Chart card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-40" />
      </div>

      {/* Student Status card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="skeleton h-4 w-28" />
        <div className="skeleton h-3 rounded-full" />
        <div className="flex justify-between">
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-3 w-14" />
        </div>
      </div>

      {/* Daily Trend card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-32" />
      </div>

      {/* At Risk card */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-16" />
      </div>
    </div>
  );
}
