import { useState, useMemo, useCallback } from "react";
import { addMonths, subMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DayModal } from "@/components/calendar/day-modal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { useCalendar } from "@/hooks/use-calendar";
import { useAllPayments } from "@/hooks/use-payments";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

export default function CalendarPage() {
  const config = useLedgerStore((s) => s.config);
  const { students } = useStudents(config?.id);
  const { overrides, loading, upsert, remove, refetch: refetchOverrides } = useCalendar(config?.id);
  const { payments, refetch: refetchPayments } = useAllPayments(config?.id);

  const refreshAll = useCallback(() => {
    refetchOverrides();
    refetchPayments();
  }, [refetchOverrides, refetchPayments]);

  useRefreshOnFocus(refreshAll);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const paymentDates = useMemo(() => {
    return new Set(payments.map((p) => p.payment_date));
  }, [payments]);

  const selectedOverride = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return overrides.find((o) => o.override_date === dateStr) || null;
  }, [selectedDate, overrides]);

  if (loading || !config) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
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
        paymentDates={paymentDates}
        onSelectDate={(date) => setSelectedDate(date)}
      />

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
