import { useCallback } from "react";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

export default function DashboardPage() {
  const config = useLedgerStore((s) => s.config);
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents(config?.id);
  const { totals, loading: totalsLoading, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { validClassDays, summary } = useLedgerMath(
    students,
    totals,
    overrides
  );

  const refreshAll = useCallback(() => {
    refetchStudents();
    refetchTotals();
  }, [refetchStudents, refetchTotals]);

  useRefreshOnFocus(refreshAll);

  if (studentsLoading || totalsLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <ProgressChart summary={summary} />

      <MonthlySummary
        summary={summary}
        totalClassDays={validClassDays.length}
        studentCount={students.length}
      />
    </div>
  );
}
