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
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">
          {format(new Date(), "MMMM yyyy")} Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <SummaryItem
            label="Collected"
            value={formatCurrency(summary.totalCollected)}
          />
          <SummaryItem
            label="Expected"
            value={formatCurrency(summary.globalExpected)}
          />
          <SummaryItem
            label="Collection Rate"
            value={`${summary.collectionRate.toFixed(1)}%`}
          />
          <SummaryItem label="Active Days" value={String(totalClassDays)} />
          <SummaryItem label="Members" value={String(studentCount)} />
          <SummaryItem
            label="Remaining"
            value={formatCurrency(summary.remaining)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-1.5 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground/70">{label}</p>
      <p className="text-xs font-bold tabular-nums">{value}</p>
    </div>
  );
}
