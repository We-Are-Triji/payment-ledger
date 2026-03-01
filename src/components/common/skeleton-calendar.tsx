export function SkeletonCalendar() {
  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 animate-page-enter">
      {/* Month nav header */}
      <div className="flex items-center justify-between">
        <div className="skeleton h-9 w-9 rounded-md" />
        <div className="skeleton h-6 w-36" />
        <div className="skeleton h-9 w-9 rounded-md" />
      </div>

      {/* Student filter chip */}
      <div className="flex justify-center">
        <div className="skeleton h-7 w-28 rounded-full" />
      </div>

      {/* Calendar grid */}
      <div className="space-y-1">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h-${i}`} className="skeleton mx-auto h-4 w-6" />
          ))}
        </div>
        {/* 5 weeks of day cells */}
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, col) => (
              <div key={col} className="skeleton aspect-square rounded-lg" />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-4 w-16" />
      </div>
    </div>
  );
}
