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
  totalContributors: number;
  onSelectDate?: (date: Date) => void;
  interactive?: boolean;
}

export function CalendarGrid({
  currentMonth,
  weekFilter,
  overrides,
  startDate,
  dayCoverage,
  totalContributors,
  onSelectDate,
  interactive = true,
  selectedDates = new Set<string>(),
  selectionMode = false,
  onStartSelection,
  onToggleSelection,
}: CalendarGridProps & {
  selectedDates?: ReadonlySet<string>;
  selectionMode?: boolean;
  onStartSelection?: (date: Date) => void;
  onToggleSelection?: (date: Date) => void;
}) {
  const overrideMap = useMemo(() => {
    const map = new Map<string, CalendarOverride>();
    overrides.forEach((override) => map.set(override.override_date, override));
    return map;
  }, [overrides]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const startDateParsed = useMemo(() => startOfDay(parseISO(startDate)), [startDate]);
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const clearLongPress = (button: HTMLButtonElement) => {
    const timer = Number(button.dataset.longPressTimer);
    if (timer) window.clearTimeout(timer);
    delete button.dataset.longPressTimer;
  };

  return (
    <div className="soft-panel rounded-[32px] p-4">
      <div className="mb-1 grid grid-cols-7 gap-1">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            {day}
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
          const isSelected = selectedDates.has(dateStr);

          const isBeforeStart = inMonth && isBefore(day, startDateParsed);
          const isStartDay = dateStr === startDate;
          const isPastOrToday = inMonth && (isBefore(day, todayStart) || today);
          const isExcluded = inMonth && !isClassDay && !override && !isBeforeStart;
          const isClickable =
            interactive && inMonth && !isBeforeStart && (isClassDay || !!override);

          let backgroundClass = "";
          if (!inMonth) {
            backgroundClass = "text-muted-foreground/30";
          } else if (isBeforeStart) {
            backgroundClass = "bg-white/[0.02] text-muted-foreground/30 cursor-not-allowed";
          } else if (isStartDay) {
            backgroundClass = "border border-[rgba(174,203,235,0.35)] bg-[rgba(174,203,235,0.2)] text-[var(--soft-blue)]";
          } else if (override) {
            backgroundClass = "border border-white/8 bg-white/[0.06] text-white hover:bg-white/[0.08] cursor-pointer";
          } else if (isPastOrToday && isClassDay) {
            const paidCount = dayCoverage.get(dateStr)?.size ?? 0;
            if (paidCount >= totalContributors && totalContributors > 0) {
              backgroundClass = "border border-[rgba(168,213,186,0.4)] bg-[rgba(168,213,186,0.18)] text-[var(--soft-mint)]";
            } else if (paidCount > 0) {
              backgroundClass = "border border-[rgba(251,228,161,0.35)] bg-[rgba(251,228,161,0.18)] text-[var(--soft-gold)]";
            } else {
              backgroundClass = "border border-[rgba(255,181,167,0.38)] bg-[rgba(255,181,167,0.16)] text-[var(--soft-peach)]";
            }
          } else if (isExcluded) {
            backgroundClass = "border border-white/8 bg-[#0f1012] text-muted-foreground cursor-not-allowed";
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!isClickable}
              aria-label={`${format(day, "MMMM d, yyyy")}${isSelected ? ", selected" : ""}`}
              aria-pressed={selectionMode ? isSelected : undefined}
              onPointerDown={(event) => {
                if (!isClickable || selectionMode || event.button !== 0) return;
                const button = event.currentTarget;
                button.dataset.pointerX = String(event.clientX);
                button.dataset.pointerY = String(event.clientY);
                button.dataset.longPressed = "false";
                button.dataset.longPressTimer = String(
                  window.setTimeout(() => {
                    button.dataset.longPressed = "true";
                    onStartSelection?.(day);
                  }, 500)
                );
              }}
              onPointerMove={(event) => {
                const button = event.currentTarget;
                if (!button.dataset.longPressTimer) return;
                const movedX = Math.abs(event.clientX - Number(button.dataset.pointerX));
                const movedY = Math.abs(event.clientY - Number(button.dataset.pointerY));
                if (movedX > 10 || movedY > 10) clearLongPress(button);
              }}
              onPointerUp={(event) => clearLongPress(event.currentTarget)}
              onPointerCancel={(event) => clearLongPress(event.currentTarget)}
              onPointerLeave={(event) => clearLongPress(event.currentTarget)}
              onContextMenu={(event) => {
                if (isClickable) event.preventDefault();
              }}
              onClick={(event) => {
                const button = event.currentTarget;
                if (button.dataset.longPressed === "true") {
                  delete button.dataset.longPressed;
                  return;
                }
                if (selectionMode) {
                  onToggleSelection?.(day);
                } else if (event.shiftKey) {
                  onStartSelection?.(day);
                } else {
                  onSelectDate?.(day);
                }
              }}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-[22px] border border-transparent text-sm transition-colors",
                backgroundClass,
                today && inMonth && "ring-2 ring-[rgba(168,213,186,0.8)]",
                isClickable && !override && !isStartDay && "hover:bg-white/[0.06]",
                isSelected && "bg-[rgba(174,203,235,0.22)] text-white ring-2 ring-[var(--soft-blue)]"
              )}
            >
              <span>{format(day, "d")}</span>
              {inMonth && override && (
                <span className="absolute bottom-1 text-[8px] leading-none text-muted-foreground">
                  NC
                </span>
              )}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--soft-blue)] text-[10px] font-bold text-[#111820]"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
