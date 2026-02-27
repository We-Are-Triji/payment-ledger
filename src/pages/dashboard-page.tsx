import { ProgressChart } from "@/components/dashboard/progress-chart";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { ExportButtons } from "@/components/dashboard/export-buttons";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { usePaymentTotals, usePaymentsWithStudents } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";

export default function DashboardPage() {
  const config = useLedgerStore((s) => s.config);
  const { students, loading: studentsLoading } = useStudents(config?.id);
  const { totals, loading: totalsLoading } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { payments } = usePaymentsWithStudents(config?.id, "month");
  const { validClassDays, summary } = useLedgerMath(
    students,
    totals,
    overrides
  );

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

      <ExportButtons
        payments={payments}
        summary={summary}
        ledgerName={config?.name || "Ledger"}
      />
    </div>
  );
}
