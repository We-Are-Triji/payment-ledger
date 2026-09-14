import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = "all" | "paid" | "partial" | "unpaid";
export type SortOption = "name-asc" | "name-desc";

interface UserFiltersProps {
  statusFilter: StatusFilter;
  sort: SortOption;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSortChange: (value: SortOption) => void;
}

export function UserFilters({
  statusFilter,
  sort,
  onStatusFilterChange,
  onSortChange,
}: UserFiltersProps) {
  return (
    <div className="soft-panel grid grid-cols-2 gap-2 rounded-[18px] p-2">
      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="h-10 w-full min-w-0 px-2.5 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Part.</SelectItem>
          <SelectItem value="unpaid">Unpd.</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="h-10 w-full min-w-0 px-2.5 text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">A-Z</SelectItem>
          <SelectItem value="name-desc">Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
