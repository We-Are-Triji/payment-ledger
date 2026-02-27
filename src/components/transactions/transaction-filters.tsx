import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const currentIndex = filters.findIndex((f) => f.value === value);

  const prev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filters.length - 1;
    onChange(filters[newIndex].value);
  };

  const next = () => {
    const newIndex = currentIndex < filters.length - 1 ? currentIndex + 1 : 0;
    onChange(filters[newIndex].value);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[6rem] text-center text-sm font-medium">
        {filters[currentIndex].label}
      </span>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
