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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {format(new Date(), "MMMM yyyy")} Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <SummaryItem
            label="Total Collected"
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
          <SummaryItem label="Class Days" value={String(totalClassDays)} />
          <SummaryItem label="Students" value={String(studentCount)} />
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
    <div className="rounded-lg bg-muted/50 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
