import { useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  format,
  getDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import type { CalendarOverride } from "@/types";

interface CalendarGridProps {
  currentMonth: Date;
  weekFilter: Record<number, boolean>;
  overrides: CalendarOverride[];
  startDate: string;
  dayCoverage: Map<string, Set<string>>;
  totalStudents: number;
  onSelectDate: (date: Date) => void;
}

export function CalendarGrid({
  currentMonth,
  weekFilter,
  overrides,
  startDate,
  dayCoverage,
  totalStudents,
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

  const startDateParsed = useMemo(() => startOfDay(parseISO(startDate)), [startDate]);
  const todayStart = useMemo(() => startOfDay(new Date()), []);

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

          const isBeforeStart = inMonth && isBefore(day, startDateParsed);
          const isStartDay = dateStr === startDate;
          const isPastOrToday = inMonth && (isBefore(day, todayStart) || today);

          const isExcluded = inMonth && !isClassDay && !override && !isBeforeStart;
          const isClickable =
            inMonth && !isBeforeStart && (isClassDay || !!override);

          // Determine background color
          let bgClass = "";
          if (!inMonth) {
            bgClass = "text-muted-foreground/30";
          } else if (isBeforeStart) {
            bgClass = "text-muted-foreground/30 cursor-not-allowed";
          } else if (isStartDay) {
            bgClass = "bg-purple-200 border border-purple-300 text-purple-900 dark:bg-purple-900 dark:border-purple-700 dark:text-purple-200";
          } else if (override) {
            bgClass = "bg-muted/50 border border-muted hover:bg-muted cursor-pointer";
          } else if (isPastOrToday && isClassDay) {
            const paidCount = dayCoverage.get(dateStr)?.size ?? 0;
            if (paidCount >= totalStudents && totalStudents > 0) {
              bgClass = "bg-green-200 border border-green-300 text-green-900 dark:bg-green-900 dark:border-green-700 dark:text-green-200";
            } else if (paidCount > 0) {
              bgClass = "bg-[#faf3a0] border border-[#f0e668] text-[#6b5d10] dark:bg-[#faf3a0] dark:border-[#f0e668] dark:text-[#6b5d10]";
            } else {
              bgClass = "bg-red-200 border border-red-300 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-200";
            }
          } else if (isExcluded) {
            bgClass = "bg-foreground/90 border border-foreground text-background cursor-not-allowed";
          }

          // Today ring applied independently of background state
          const ringClass = today && inMonth ? "ring-2 ring-[#00FF00]" : "";

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && onSelectDate(day)}
              disabled={!isClickable}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                bgClass,
                ringClass,
                isClickable && !override && !isStartDay && "hover:bg-accent/10"
              )}
            >
              <span>{format(day, "d")}</span>
              {inMonth && override && (
                <span className="absolute bottom-0.5 text-[8px] leading-none text-muted-foreground">
                  NC
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
