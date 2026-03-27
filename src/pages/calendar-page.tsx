import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths, subDays, isBefore, startOfMonth, format } from "date-fns";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarLegendModal } from "@/components/calendar/calendar-legend";
import { DayModal } from "@/components/calendar/day-modal";
import { StudentFilterModal } from "@/components/calendar/student-filter-modal";
import { SkeletonCalendar } from "@/components/common/skeleton-calendar";
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
  const [studentFilter, setStudentFilter] = useState<Set<string> | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!studentFilter) return students;
    return students.filter((s) => studentFilter.has(s.id));
  }, [students, studentFilter]);

  const dayCoverage = useMemo(() => {
    if (!config) return new Map<string, Set<string>>();
    const yesterday = subDays(new Date(), 1);
    const classDays = getValidClassDays(
      new Date(config.start_date),
      yesterday,
      config.week_filter,
      overrides
    );
    return buildDayCoverage(classDays, filteredStudents, totals, config.deposit_amount);
  }, [config, overrides, filteredStudents, totals]);

  const selectedOverride = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return overrides.find((o) => o.override_date === dateStr) || null;
  }, [selectedDate, overrides]);

  if (loading || !config) return <SkeletonCalendar />;

  const ledgerStartMonth = startOfMonth(new Date(config.start_date));
  const canGoPrev = isBefore(ledgerStartMonth, startOfMonth(currentMonth));

  return (
    <div className="page-shell animate-page-enter">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!canGoPrev}
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <p className="section-kicker mb-2">Coverage Calendar</p>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => setFilterModalOpen(true)}
          className="soft-stat-pill flex items-center gap-1.5 text-xs text-white transition hover:bg-white/[0.08]"
        >
          <Users className="h-3.5 w-3.5" />
          {studentFilter
            ? `${studentFilter.size} Member${studentFilter.size !== 1 ? "s" : ""} Selected`
            : "All Members"}
        </button>
        {studentFilter && (
          <div className="flex flex-wrap justify-center gap-1">
            {filteredStudents.slice(0, 5).map((s) => (
              <span key={s.id} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white">
                {s.name}
              </span>
            ))}
            {filteredStudents.length > 5 && (
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white">
                +{filteredStudents.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>

      <CalendarGrid
        currentMonth={currentMonth}
        weekFilter={config.week_filter}
        overrides={overrides}
        startDate={config.start_date}
        dayCoverage={dayCoverage}
        totalStudents={filteredStudents.length}
        onSelectDate={(date) => setSelectedDate(date)}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setLegendOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--soft-gold)] text-xs font-bold text-[#1a1813] shadow-[0_14px_28px_rgba(251,228,161,0.16)]"
        >
          !
        </button>
      </div>

      <CalendarLegendModal open={legendOpen} onOpenChange={setLegendOpen} />

      {selectedDate && (
        <DayModal
          open={!!selectedDate}
          onOpenChange={(open) => {
            if (!open) setSelectedDate(null);
          }}
          date={selectedDate}
          students={filteredStudents}
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

      <StudentFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        students={students}
        selectedIds={studentFilter}
        onConfirm={setStudentFilter}
      />
    </div>
  );
}
