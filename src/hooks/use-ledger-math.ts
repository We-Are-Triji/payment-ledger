import { useMemo } from "react";
import { useLedgerStore } from "@/store/ledger-store";
import {
  getValidClassDays,
  calculateTotalExpected,
  calculateStudentBalance,
  calculateStudentStatus,
  calculateGlobalSummary,
} from "@/lib/ledger-math";
import type {
  CalendarOverride,
  Student,
  StudentWithBalance,
  GlobalSummary,
} from "@/types";

export function useLedgerMath(
  students: Student[],
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

  const studentsWithBalance: StudentWithBalance[] = useMemo(() => {
    return students.map((student) => {
      const totalPaid = paymentTotals[student.id] || 0;
      return {
        ...student,
        totalPaid,
        balance: calculateStudentBalance(totalPaid, totalExpected),
        status: calculateStudentStatus(totalPaid, totalExpected),
      };
    });
  }, [students, paymentTotals, totalExpected]);

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
      studentsWithBalance.map((s) => ({ totalPaid: s.totalPaid })),
      totalExpected,
      config.payment_goal
    );
  }, [studentsWithBalance, totalExpected, config]);

  return {
    validClassDays,
    totalExpected,
    studentsWithBalance,
    summary,
  };
}
