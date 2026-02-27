import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatDate } from "@/lib/utils";
import type { CalendarOverride } from "@/types";

interface HolidayToggleProps {
  date: Date;
  override: CalendarOverride | null;
  ledgerId: string;
  onToggle: (
    status: "holiday" | "no_class",
    label: string | null
  ) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function HolidayToggle({
  date,
  override,
  onToggle,
  onRemove,
}: HolidayToggleProps) {
  const [status, setStatus] = useState<"holiday" | "no_class">(
    override?.status || "holiday"
  );
  const [label, setLabel] = useState(override?.label || "");
  const isActive = !!override;

  const handleToggle = async (checked: boolean) => {
    try {
      if (checked) {
        await onToggle(status, label || null);
        toast.success(
          `${formatDate(date)} marked as ${status === "holiday" ? "Holiday" : "No Class"}. Total Expected recalculated.`
        );
      } else {
        await onRemove();
        toast.success(
          `${formatDate(date)} restored as a class day. Total Expected recalculated.`
        );
      }
    } catch {
      toast.error("Failed to update calendar");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={`holiday-${format(date, "yyyy-MM-dd")}`}>
          Mark as Non-Class Day
        </Label>
        <Switch
          id={`holiday-${format(date, "yyyy-MM-dd")}`}
          checked={isActive}
          onCheckedChange={handleToggle}
        />
      </div>

      {(isActive || !override) && (
        <div className="space-y-2">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as typeof status);
              if (isActive) onToggle(v as typeof status, label || null);
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="holiday">Holiday</SelectItem>
              <SelectItem value="no_class">No Class</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Label (e.g., National Heroes Day)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => {
              if (isActive) onToggle(status, label || null);
            }}
            className="h-8 text-xs"
          />
        </div>
      )}
    </div>
  );
}
