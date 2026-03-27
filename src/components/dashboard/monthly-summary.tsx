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
            <CardTitle className="text-2xl font-semibold">Collected so far</CardTitle>
          </div>
          <span className="soft-stat-pill text-xs font-semibold text-[var(--soft-mint)]">
            {summary.collectionRate.toFixed(1)}% collected
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1">
          <p className="hero-number text-white">{formatCurrency(summary.totalCollected)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
    <div className="soft-subpanel rounded-[22px] p-3.5 text-left">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">{label}</p>
      <p className={`mt-1.5 text-base font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
