import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const isActive = !!override;
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    try {
      setToggling(true);
      if (checked) {
        await onToggle("no_class", null);
        toast.success(
          `${formatDate(date)} marked as No Class. Total Expected recalculated.`
        );
      } else {
        await onRemove();
        toast.success(
          `${formatDate(date)} restored as a class day. Total Expected recalculated.`
        );
      }
    } catch {
      toast.error("Failed to update calendar");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <Label htmlFor={`no-class-${format(date, "yyyy-MM-dd")}`}>
        Mark as No Class
      </Label>
      <Switch
        id={`no-class-${format(date, "yyyy-MM-dd")}`}
        checked={isActive}
        disabled={toggling}
        onCheckedChange={handleToggle}
      />
    </div>
  );
}
