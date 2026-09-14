import { eachDayOfInterval, getDay, format, startOfDay } from "date-fns";
import type {
  CalendarOverride,
  Contributor,
  Payment,
  GlobalSummary,
  DaySummary,
} from "@/types";

type WeekFilter = Record<number, boolean>;

export function getValidClassDays(
  startDate: Date,
  endDate: Date,
  weekFilter: WeekFilter,
  overrides: CalendarOverride[]
): Date[] {
  if (startDate > endDate) return [];
  const overrideSet = new Set(overrides.map((o) => o.override_date));
  const allDays = eachDayOfInterval({
    start: startOfDay(startDate),
    end: startOfDay(endDate),
  });

  return allDays.filter((day) => {
    const dayOfWeek = getDay(day);
    const dateStr = format(day, "yyyy-MM-dd");
    return weekFilter[dayOfWeek] && !overrideSet.has(dateStr);
  });
}

export function calculateTotalExpected(
  validClassDays: Date[],
  depositAmount: number
): number {
  return validClassDays.length * depositAmount;
}

export function calculateContributorBalance(
  totalPaid: number,
  totalExpected: number
): number {
  return totalPaid - totalExpected;
}

export function calculateDaysEquivalent(
  balance: number,
  depositAmount: number
): number {
  if (depositAmount === 0) return 0;
  return Math.floor(balance / depositAmount);
}

export function calculateContributorStatus(
  totalPaid: number,
  totalExpected: number
): "paid" | "partial" | "unpaid" {
  if (totalPaid >= totalExpected) return "paid";
  if (totalPaid > 0) return "partial";
  return "unpaid";
}

export function isValidClassDay(
  date: Date,
  weekFilter: WeekFilter,
  overrides: CalendarOverride[]
): boolean {
  const dayOfWeek = getDay(date);
  const dateStr = format(date, "yyyy-MM-dd");
  const overrideSet = new Set(overrides.map((o) => o.override_date));
  return weekFilter[dayOfWeek] && !overrideSet.has(dateStr);
}

export function buildDayCoverage(
  validClassDays: Date[],
  contributors: Array<{ id: string }>,
  paymentTotals: Record<string, number>,
  depositAmount: number
): Map<string, Set<string>> {
  const coverage = new Map<string, Set<string>>();
  for (const day of validClassDays) {
    coverage.set(format(day, "yyyy-MM-dd"), new Set());
  }
  if (depositAmount <= 0) return coverage;
  for (const contributor of contributors) {
    const totalPaid = paymentTotals[contributor.id] || 0;
    const daysCovered = Math.floor(totalPaid / depositAmount);
    for (let i = 0; i < Math.min(daysCovered, validClassDays.length); i++) {
      const dateStr = format(validClassDays[i], "yyyy-MM-dd");
      coverage.get(dateStr)!.add(contributor.id);
    }
  }
  return coverage;
}

export function calculateGlobalSummary(
  contributors: Array<{ totalPaid: number }>,
  totalExpected: number,
  paymentGoal: number
): GlobalSummary {
  const totalCollected = contributors.reduce((sum, c) => sum + c.totalPaid, 0);
  const globalExpected = totalExpected * contributors.length;
  return {
    totalCollected,
    globalExpected,
    collectionRate:
      globalExpected > 0 ? (totalCollected / globalExpected) * 100 : 0,
    goalProgress:
      paymentGoal > 0 ? (totalCollected / paymentGoal) * 100 : 0,
    remaining: Math.max(0, paymentGoal - totalCollected),
    paymentGoal,
  };
}

export function calculateDaySummary(
  date: Date,
  contributors: Array<Pick<Contributor, "id" | "name" | "avatar_url">>,
  payments: Payment[],
  depositAmount: number
): DaySummary {
  const dateStr = format(date, "yyyy-MM-dd");
  const dayPayments = payments.filter((p) => p.payment_date === dateStr);
  const paidContributorIds = new Set(dayPayments.map((p) => p.contributor_id));

  const paid = contributors.filter((c) => paidContributorIds.has(c.id));
  const missed = contributors.filter((c) => !paidContributorIds.has(c.id));
  const totalCollected = dayPayments.reduce((sum, p) => sum + p.amount, 0);

  return {
    paid,
    missed,
    totalCollected,
    expectedForDay: contributors.length * depositAmount,
  };
}
