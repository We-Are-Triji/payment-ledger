import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarOverride } from "@/types";
import { CALENDAR_STATUS_CONFIG } from "@/lib/constants";

interface CalendarGridProps {
  currentMonth: Date;
  weekFilter: Record<number, boolean>;
  overrides: CalendarOverride[];
  paymentDates: Set<string>;
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  weekFilter,
  overrides,
  paymentDates,
  onSelectDate,
}: CalendarGridProps) {
  const overrideMap = useMemo(() => {
    const map = new Map<string, CalendarOverride>();
    overrides.forEach((o) => map.set(o.override_date, o));
    return map;
  }, [overrides]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 gap-1">
        {dayHeaders.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const dayOfWeek = getDay(day);
          const isClassDay = weekFilter[dayOfWeek];
          const override = overrideMap.get(dateStr);
          const hasPayments = paymentDates.has(dateStr);

          let dotColor = "";
          if (override) {
            dotColor = CALENDAR_STATUS_CONFIG[override.status].color;
          } else if (!isClassDay) {
            dotColor = "";
          } else if (hasPayments) {
            dotColor = "bg-green-500";
          }

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              disabled={!inMonth}
              className={cn(
                "relative flex h-10 flex-col items-center justify-center rounded-md text-sm transition-colors",
                inMonth
                  ? "hover:bg-accent/10"
                  : "text-muted-foreground/30",
                today && "ring-2 ring-primary",
                override && "bg-muted/50"
              )}
            >
              <span>{format(day, "d")}</span>
              {inMonth && dotColor && !override && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    dotColor
                  )}
                />
              )}
              {inMonth && override && (
                <span className="absolute bottom-0.5 text-[8px] leading-none text-muted-foreground">
                  {override.status === "holiday" ? "H" : "NC"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
