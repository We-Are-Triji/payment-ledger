import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths, subDays, isBefore, startOfMonth, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarLegend } from "@/components/calendar/calendar-legend";
import { DayModal } from "@/components/calendar/day-modal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { useCalendar } from "@/hooks/use-calendar";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { getValidClassDays, buildDayCoverage } from "@/lib/ledger-math";

export default function CalendarPage() {
  const config = useLedgerStore((s) => s.config);
  const { students } = useStudents(config?.id);
  const { overrides, loading, upsert, remove, refetch: refetchOverrides } = useCalendar(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);

  const refreshAll = useCallback(() => {
    refetchOverrides();
    refetchTotals();
  }, [refetchOverrides, refetchTotals]);

  useRefreshOnFocus(refreshAll);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dayCoverage = useMemo(() => {
    if (!config) return new Map<string, Set<string>>();
    const yesterday = subDays(new Date(), 1);
    const classDays = getValidClassDays(
      new Date(config.start_date),
      yesterday,
      config.week_filter,
      overrides
    );
    return buildDayCoverage(classDays, students, totals, config.deposit_amount);
  }, [config, overrides, students, totals]);

  const selectedOverride = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return overrides.find((o) => o.override_date === dateStr) || null;
  }, [selectedDate, overrides]);

  if (loading || !config) return <LoadingSpinner />;

  const ledgerStartMonth = startOfMonth(new Date(config.start_date));
  const canGoPrev = isBefore(ledgerStartMonth, startOfMonth(currentMonth));

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          disabled={!canGoPrev}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        weekFilter={config.week_filter}
        overrides={overrides}
        startDate={config.start_date}
        dayCoverage={dayCoverage}
        totalStudents={students.length}
        onSelectDate={(date) => setSelectedDate(date)}
      />

      <CalendarLegend />

      {selectedDate && (
        <DayModal
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null);
          }}
          date={selectedDate}
          students={students}
          override={selectedOverride}
          depositAmount={config.deposit_amount}
          ledgerId={config.id}
          coveredStudentIds={
            dayCoverage.get(format(selectedDate, "yyyy-MM-dd")) ?? new Set()
          }
          onToggleOverride={async (status, label) => {
            await upsert({
              override_date: format(selectedDate, "yyyy-MM-dd"),
              status,
              label,
              ledger_id: config.id,
            });
          }}
          onRemoveOverride={async () => {
            await remove(format(selectedDate, "yyyy-MM-dd"));
          }}
        />
      )}
    </div>
  );
}
