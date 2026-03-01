import { useCallback } from "react";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { StudentStatusCard } from "@/components/dashboard/student-status-card";
import { DailyTrendCard } from "@/components/dashboard/daily-trend-card";
import { AtRiskCard } from "@/components/dashboard/at-risk-card";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { usePaymentTotals, useAllPayments } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

export default function DashboardPage() {
  const config = useLedgerStore((s) => s.config);
  const { students, loading: studentsLoading, refetch: refetchStudents } = useStudents(config?.id);
  const { totals, loading: totalsLoading, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { payments: allPayments, refetch: refetchPayments } = useAllPayments(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { validClassDays, studentsWithBalance, summary } = useLedgerMath(
    students,
    totals,
    overrides
  );

  const refreshAll = useCallback(() => {
    refetchStudents();
    refetchTotals();
    refetchPayments();
  }, [refetchStudents, refetchTotals, refetchPayments]);

  useRefreshOnFocus(refreshAll);

  if (studentsLoading || totalsLoading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <h2 className="text-lg font-semibold">Dashboard</h2>

      <MonthlySummary
        summary={summary}
        totalClassDays={validClassDays.length}
        studentCount={students.length}
      />

      <ProgressChart summary={summary} />

      <StudentStatusCard studentsWithBalance={studentsWithBalance} />

      <DailyTrendCard
        payments={allPayments}
        validClassDays={validClassDays}
        depositAmount={config?.deposit_amount || 0}
        studentCount={students.length}
      />

      <AtRiskCard
        studentsWithBalance={studentsWithBalance}
        depositAmount={config?.deposit_amount || 0}
      />
    </div>
  );
}
