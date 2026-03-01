export function SkeletonTransactions() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
