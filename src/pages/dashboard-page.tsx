import { useCallback } from "react";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { MonthlySummary } from "@/components/dashboard/monthly-summary";
import { ContributorStatusCard } from "@/components/dashboard/contributor-status-card";
import { DailyTrendCard } from "@/components/dashboard/daily-trend-card";
import { AtRiskCard } from "@/components/dashboard/at-risk-card";
import { SkeletonDashboard } from "@/components/common/skeleton-dashboard";
import { useLedgerStore } from "@/store/ledger-store";
import { useContributors } from "@/hooks/use-contributors";
import { usePaymentTotals, useAllPayments } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";

export default function DashboardPage() {
  const config = useLedgerStore((s) => s.config);
  const { contributors, loading: contributorsLoading, refetch: refetchContributors } = useContributors(config?.id);
  const { totals, loading: totalsLoading, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { payments: allPayments, refetch: refetchPayments } = useAllPayments(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { validClassDays, contributorsWithBalance, summary } = useLedgerMath(
    contributors,
    totals,
    overrides
  );

  const refreshAll = useCallback(() => {
    refetchContributors();
    refetchTotals();
    refetchPayments();
  }, [refetchContributors, refetchTotals, refetchPayments]);

  useRefreshOnFocus(refreshAll);

  if (contributorsLoading || totalsLoading) return <SkeletonDashboard />;

  return (
    <div className="page-shell animate-page-enter animate-stagger-in">
      <MonthlySummary
        summary={summary}
        totalClassDays={validClassDays.length}
        contributorCount={contributors.length}
      />

      <ProgressChart summary={summary} />

      <ContributorStatusCard contributorsWithBalance={contributorsWithBalance} />

      <DailyTrendCard
        payments={allPayments}
        validClassDays={validClassDays}
        depositAmount={config?.deposit_amount || 0}
        contributorCount={contributors.length}
      />

      <AtRiskCard
        contributorsWithBalance={contributorsWithBalance}
        depositAmount={config?.deposit_amount || 0}
      />
    </div>
  );
}
