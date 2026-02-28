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
          const isPast = inMonth && isBefore(day, todayStart) && !today;

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
            bgClass = "bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200";
          } else if (override) {
            bgClass = "bg-muted/50 hover:bg-muted cursor-pointer";
          } else if (today && isClassDay) {
            bgClass = "bg-green-100 ring-2 ring-primary dark:bg-green-950";
          } else if (isPast && isClassDay) {
            const paidCount = dayCoverage.get(dateStr)?.size ?? 0;
            if (paidCount >= totalStudents && totalStudents > 0) {
              bgClass = "bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200";
            } else if (paidCount > 0) {
              bgClass = "bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200";
            } else {
              bgClass = "bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200";
            }
          } else if (isExcluded) {
            bgClass = "bg-foreground/90 text-background cursor-not-allowed";
          }

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && onSelectDate(day)}
              disabled={!isClickable}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors",
                bgClass,
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
