export function CalendarLegend() {
  const items = [
    { color: "bg-purple-200 dark:bg-purple-900", label: "Start" },
    { color: "bg-green-200 dark:bg-green-900", label: "All Paid" },
    { color: "bg-amber-200 dark:bg-amber-900", label: "Partial" },
    { color: "bg-red-200 dark:bg-red-900", label: "Unpaid" },
    { color: "bg-muted/50", label: "Holiday" },
    { color: "bg-green-100 ring-2 ring-primary dark:bg-green-950", label: "Today" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span
            className={`inline-block h-3 w-3 rounded-full ${item.color}`}
          />
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
