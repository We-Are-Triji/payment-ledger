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
  onSelectDate?: (date: Date) => void;
  interactive?: boolean;
}

export function CalendarGrid({
  currentMonth,
  weekFilter,
  overrides,
  startDate,
  dayCoverage,
  totalStudents,
  onSelectDate,
  interactive = true,
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
    <div className="soft-panel rounded-[32px] p-4">
      <div className="mb-1 grid grid-cols-7 gap-1">
        {dayHeaders.map((d) => (
          <div
            key={d}
            className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
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
            interactive && inMonth && !isBeforeStart && (isClassDay || !!override);

          // Determine background color
          let bgClass = "";
          if (!inMonth) {
            bgClass = "text-muted-foreground/30";
          } else if (isBeforeStart) {
            bgClass = "bg-white/[0.02] text-muted-foreground/30 cursor-not-allowed";
          } else if (isStartDay) {
            bgClass = "border border-[rgba(174,203,235,0.35)] bg-[rgba(174,203,235,0.2)] text-[var(--soft-blue)]";
          } else if (override) {
            bgClass = "border border-white/8 bg-white/[0.06] text-white hover:bg-white/[0.08] cursor-pointer";
          } else if (isPastOrToday && isClassDay) {
            const paidCount = dayCoverage.get(dateStr)?.size ?? 0;
            if (paidCount >= totalStudents && totalStudents > 0) {
              bgClass = "border border-[rgba(168,213,186,0.4)] bg-[rgba(168,213,186,0.18)] text-[var(--soft-mint)]";
            } else if (paidCount > 0) {
              bgClass = "border border-[rgba(251,228,161,0.35)] bg-[rgba(251,228,161,0.18)] text-[var(--soft-gold)]";
            } else {
              bgClass = "border border-[rgba(255,181,167,0.38)] bg-[rgba(255,181,167,0.16)] text-[var(--soft-peach)]";
            }
          } else if (isExcluded) {
            bgClass = "border border-white/8 bg-[#0f1012] text-muted-foreground cursor-not-allowed";
          }

          // Today ring applied independently of background state
          const ringClass = today && inMonth ? "ring-2 ring-[rgba(168,213,186,0.8)]" : "";

          return (
            <button
              key={dateStr}
              onClick={() => isClickable && onSelectDate?.(day)}
              disabled={!isClickable}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-[22px] border border-transparent text-sm transition-colors",
                bgClass,
                ringClass,
                isClickable && !override && !isStartDay && "hover:bg-white/[0.06]"
              )}
            >
              <span>{format(day, "d")}</span>
              {inMonth && override && (
                <span className="absolute bottom-1 text-[8px] leading-none text-muted-foreground">
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
