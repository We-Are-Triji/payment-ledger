import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TransactionFilter } from "@/types";

const filters: { value: TransactionFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

interface TransactionFiltersProps {
  value: TransactionFilter;
  onChange: (filter: TransactionFilter) => void;
}

export function TransactionFilters({ value, onChange }: TransactionFiltersProps) {
  return (
    <div className="flex gap-1">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? "default" : "outline"}
          size="sm"
          className={cn("flex-1 text-xs")}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
