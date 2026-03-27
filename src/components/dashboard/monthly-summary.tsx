import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import type { GlobalSummary } from "@/types";

interface MonthlySummaryProps {
  summary: GlobalSummary;
  totalClassDays: number;
  studentCount: number;
}

export function MonthlySummary({
  summary,
  totalClassDays,
  studentCount,
}: MonthlySummaryProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-3 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-kicker mb-1.5">{format(new Date(), "MMMM yyyy")} Snapshot</p>
            <CardTitle className="text-2xl font-semibold">Current Balance</CardTitle>
          </div>
          <span className="soft-stat-pill text-xs font-semibold text-[var(--soft-mint)]">
            {summary.collectionRate.toFixed(1)}% on track
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="rounded-[22px] border border-[rgba(168,213,186,0.3)] bg-[linear-gradient(145deg,rgba(168,213,186,0.96),rgba(125,190,149,0.85))] px-4 py-5 text-center shadow-[0_24px_50px_rgba(70,122,91,0.28)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#173523]/70">
            Current Balance
          </p>
          <p className="hero-number mt-2 text-[#101913]">{formatCurrency(summary.totalCollected)}</p>
          <p className="mt-2 text-sm text-[#173523]/70">
            {totalClassDays} active days • {studentCount} members
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <SummaryItem
            label="Expected"
            value={formatCurrency(summary.globalExpected)}
            tone="text-[var(--soft-blue)]"
          />
          <SummaryItem
            label="Remaining"
            value={formatCurrency(summary.remaining)}
            tone="text-[var(--soft-peach)]"
          />
          <SummaryItem
            label="Active Days"
            value={String(totalClassDays)}
            tone="text-[var(--soft-gold)]"
          />
          <SummaryItem
            label="Members"
            value={String(studentCount)}
            tone="text-[var(--soft-mint)]"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="soft-subpanel rounded-[16px] px-3.5 py-3 text-left">
      <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground/75">{label}</p>
      <p className={`mt-1.5 text-base font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
