import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths, subDays, isBefore, startOfMonth, format } from "date-fns";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarLegendModal } from "@/components/calendar/calendar-legend";
import { DayModal } from "@/components/calendar/day-modal";
import { ContributorFilterModal } from "@/components/calendar/contributor-filter-modal";
import { SkeletonCalendar } from "@/components/common/skeleton-calendar";
import { useLedgerStore } from "@/store/ledger-store";
import { useContributors } from "@/hooks/use-contributors";
import { useCalendar } from "@/hooks/use-calendar";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import { getValidClassDays, buildDayCoverage } from "@/lib/ledger-math";

export default function CalendarPage() {
  const config = useLedgerStore((state) => state.config);
  const { contributors } = useContributors(config?.id);
  const { overrides, loading, upsert, remove, refetch: refetchOverrides } = useCalendar(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);

  const refreshAll = useCallback(() => {
    refetchOverrides();
    refetchTotals();
  }, [refetchOverrides, refetchTotals]);

  useRefreshOnFocus(refreshAll);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [contributorFilter, setContributorFilter] = useState<Set<string> | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const selectionMode = selectedDates.size > 0;

  const filteredContributors = useMemo(() => {
    if (!contributorFilter) return contributors;
    return contributors.filter((contributor) => contributorFilter.has(contributor.id));
  }, [contributors, contributorFilter]);

  const dayCoverage = useMemo(() => {
    if (!config) return new Map<string, Set<string>>();
    const yesterday = subDays(new Date(), 1);
    const classDays = getValidClassDays(
      new Date(config.start_date),
      yesterday,
      config.week_filter,
      overrides
    );
    return buildDayCoverage(classDays, filteredContributors, totals, config.deposit_amount);
  }, [config, overrides, filteredContributors, totals]);

  const selectedOverride = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return overrides.find((override) => override.override_date === dateStr) || null;
  }, [selectedDate, overrides]);

  const startSelection = useCallback((date: Date) => {
    setSelectedDate(null);
    setBulkMessage(null);
    setSelectedDates(new Set([format(date, "yyyy-MM-dd")]));
  }, []);

  const toggleSelectedDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setBulkMessage(null);
    setSelectedDates((current) => {
      const next = new Set(current);
      if (next.has(dateStr)) next.delete(dateStr);
      else next.add(dateStr);
      return next;
    });
  }, []);

  const cancelSelection = useCallback(() => {
    setSelectedDates(new Set());
    setBulkMessage(null);
  }, []);

  const markSelectedAsOffDays = useCallback(async () => {
    if (!config || bulkUpdating || selectedDates.size === 0) return;

    const dates = [...selectedDates].sort();
    setBulkUpdating(true);
    setBulkMessage(null);

    try {
      const results = await Promise.allSettled(
        dates.map((date) =>
          upsert({
            override_date: date,
            status: "skip_day",
            label: null,
            ledger_id: config.id,
          })
        )
      );
      const failedDates = dates.filter((_, index) => results[index].status === "rejected");

      if (failedDates.length > 0) {
        setSelectedDates(new Set(failedDates));
        setBulkMessage(
          `${dates.length - failedDates.length} updated. ${failedDates.length} could not be marked; try again.`
        );
      } else {
        setSelectedDates(new Set());
        setBulkMessage(`${dates.length} date${dates.length === 1 ? "" : "s"} marked as Off Day.`);
      }
    } finally {
      setBulkUpdating(false);
    }
  }, [bulkUpdating, config, selectedDates, upsert]);

  if (loading || !config) return <SkeletonCalendar />;

  const ledgerStartMonth = startOfMonth(new Date(config.start_date));
  const canGoPrev = isBefore(ledgerStartMonth, startOfMonth(currentMonth));

  return (
    <div className="page-shell animate-page-enter">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={bulkUpdating || !canGoPrev}
          onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
          aria-label="Previous month"
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
          disabled={bulkUpdating}
          onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          className="soft-stat-pill flex items-center gap-1.5 text-xs text-white transition hover:bg-white/[0.08]"
        >
          <Users className="h-3.5 w-3.5" />
          {contributorFilter
            ? `${contributorFilter.size} Contributor${contributorFilter.size !== 1 ? "s" : ""} Selected`
            : "All Contributors"}
        </button>
        {contributorFilter && (
          <div className="flex flex-wrap justify-center gap-1">
            {filteredContributors.slice(0, 5).map((contributor) => (
              <span key={contributor.id} className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white">
                {contributor.name}
              </span>
            ))}
            {filteredContributors.length > 5 && (
              <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white">
                +{filteredContributors.length - 5} more
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
        totalContributors={filteredContributors.length}
        onSelectDate={setSelectedDate}
        selectedDates={selectedDates}
        selectionMode={selectionMode}
        onStartSelection={startSelection}
        onToggleSelection={toggleSelectedDate}
      />

      <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
        {selectionMode
          ? "Tap dates to add or remove them from the selection."
          : bulkMessage || "Long-press a date to select multiple days. Shift-click also works on desktop."}
      </p>

      {selectionMode && (
        <div className="soft-panel flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">
              {selectedDates.size} date{selectedDates.size === 1 ? "" : "s"} selected
            </p>
            <p className="text-xs text-muted-foreground">
              {bulkMessage || "Review the highlighted dates before applying changes."}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              disabled={bulkUpdating}
              onClick={cancelSelection}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none"
              disabled={bulkUpdating}
              onClick={markSelectedAsOffDays}
            >
              {bulkUpdating ? "Marking…" : "Mark as Off Day"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          aria-label="Open calendar legend"
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
          contributors={filteredContributors}
          override={selectedOverride}
          depositAmount={config.deposit_amount}
          ledgerId={config.id}
          coveredContributorIds={
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

      <ContributorFilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        contributors={contributors}
        selectedIds={contributorFilter}
        onConfirm={setContributorFilter}
      />
    </div>
  );
}
