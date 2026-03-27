import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SexFilter = "all" | "male" | "female" | "other";
export type StatusFilter = "all" | "paid" | "partial" | "unpaid";
export type SortOption = "name-asc" | "name-desc";

interface UserFiltersProps {
  sexFilter: SexFilter;
  statusFilter: StatusFilter;
  sort: SortOption;
  onSexFilterChange: (value: SexFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onSortChange: (value: SortOption) => void;
}

export function UserFilters({
  sexFilter,
  statusFilter,
  sort,
  onSexFilterChange,
  onStatusFilterChange,
  onSortChange,
}: UserFiltersProps) {
  return (
    <div className="soft-panel grid grid-cols-1 gap-2 rounded-[24px] p-2.5 sm:grid-cols-3">
      <Select value={sexFilter} onValueChange={(v) => onSexFilterChange(v as SexFilter)}>
        <SelectTrigger className="h-10 w-full min-w-0 text-xs">
          <SelectValue placeholder="Sex" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sex</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="h-10 w-full min-w-0 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="h-10 w-full min-w-0 text-xs">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A-Z</SelectItem>
          <SelectItem value="name-desc">Name Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
