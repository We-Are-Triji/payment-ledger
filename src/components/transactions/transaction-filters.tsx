import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TransactionPreset } from "@/types";

interface TransactionFiltersProps {
  preset: TransactionPreset;
  onPresetChange: (p: TransactionPreset) => void;
  search: string;
  onSearchChange: (s: string) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (d: string) => void;
  onCustomToChange: (d: string) => void;
  showVoided: boolean;
  onShowVoidedChange: (v: boolean) => void;
}

export function TransactionFilters({
  preset,
  onPresetChange,
  search,
  onSearchChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  showVoided,
  onShowVoidedChange,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={preset} onValueChange={(v) => onPresetChange(v as TransactionPreset)}>
          <SelectTrigger size="sm" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="yesterday">Yesterday</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <Switch
            id="show-voided"
            size="sm"
            checked={showVoided}
            onCheckedChange={onShowVoidedChange}
          />
          <Label htmlFor="show-voided" className="text-xs text-muted-foreground whitespace-nowrap">
            Show voided
          </Label>
        </div>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="tx-from" className="text-xs">From</Label>
            <Input
              id="tx-from"
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tx-to" className="text-xs">To</Label>
            <Input
              id="tx-to"
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
