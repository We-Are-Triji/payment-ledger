import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ, Filter, Users } from "lucide-react";

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
  const sexLabel = {
    all: "Any",
    male: "Male",
    female: "Female",
    other: "Other",
  }[sexFilter];

  const statusLabel = {
    all: "Any",
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
  }[statusFilter];

  const sortLabel = sort === "name-asc" ? "A-Z" : "Z-A";

  return (
    <div className="soft-panel grid grid-cols-3 gap-2 rounded-[18px] p-2">
      <Select value={sexFilter} onValueChange={(v) => onSexFilterChange(v as SexFilter)}>
        <SelectTrigger className="h-10 w-full min-w-0 px-2.5 text-xs">
          <div className="flex min-w-0 items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{sexLabel}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
        <SelectTrigger className="h-10 w-full min-w-0 px-2.5 text-xs">
          <div className="flex min-w-0 items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">
              <span className="hidden min-[400px]:inline">{statusLabel}</span>
              <span className="min-[400px]:hidden">
                {statusFilter === "partial" ? "Part." : statusLabel}
              </span>
            </span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="partial">Partial</SelectItem>
          <SelectItem value="unpaid">Unpaid</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="h-10 w-full min-w-0 px-2.5 text-xs">
          <div className="flex min-w-0 items-center gap-1.5">
            {sort === "name-asc" ? (
              <ArrowUpAZ className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ArrowDownAZ className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className="truncate">{sortLabel}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="name-asc">Name A-Z</SelectItem>
          <SelectItem value="name-desc">Name Z-A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
