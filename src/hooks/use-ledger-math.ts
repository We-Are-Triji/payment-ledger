import { useMemo } from "react";
import { useLedgerStore } from "@/store/ledger-store";
import {
  getValidClassDays,
  calculateTotalExpected,
  calculateContributorBalance,
  calculateContributorStatus,
  calculateGlobalSummary,
} from "@/lib/ledger-math";
import type {
  CalendarOverride,
  Contributor,
  ContributorWithBalance,
  GlobalSummary,
} from "@/types";

export function useLedgerMath(
  contributors: Contributor[],
  paymentTotals: Record<string, number>,
  overrides: CalendarOverride[]
) {
  const config = useLedgerStore((s) => s.config);

  const validClassDays = useMemo(() => {
    if (!config) return [];
    return getValidClassDays(
      new Date(config.start_date),
      new Date(),
      config.week_filter,
      overrides
    );
  }, [config, overrides]);

  const totalExpected = useMemo(() => {
    if (!config) return 0;
    return calculateTotalExpected(validClassDays, config.deposit_amount);
  }, [validClassDays, config]);

  const contributorsWithBalance: ContributorWithBalance[] = useMemo(() => {
    return contributors.map((contributor) => {
      const totalPaid = paymentTotals[contributor.id] || 0;
      return {
        ...contributor,
        totalPaid,
        balance: calculateContributorBalance(totalPaid, totalExpected),
        status: calculateContributorStatus(totalPaid, totalExpected),
      };
    });
  }, [contributors, paymentTotals, totalExpected]);

  const summary: GlobalSummary = useMemo(() => {
    if (!config)
      return {
        totalCollected: 0,
        globalExpected: 0,
        collectionRate: 0,
        goalProgress: 0,
        remaining: 0,
        paymentGoal: 0,
      };
    return calculateGlobalSummary(
      contributorsWithBalance.map((c) => ({ totalPaid: c.totalPaid })),
      totalExpected,
      config.payment_goal
    );
  }, [contributorsWithBalance, totalExpected, config]);

  return {
    validClassDays,
    totalExpected,
    contributorsWithBalance,
    summary,
  };
}
