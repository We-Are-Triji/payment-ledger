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
  totalClassDays: _totalClassDays,
  studentCount: _studentCount,
}: MonthlySummaryProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-2 pb-0">
        <p className="section-kicker">{format(new Date(), "MMMM yyyy")} Snapshot</p>
        <CardTitle className="text-2xl font-semibold">Current Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-1">
        <div className="rounded-[22px] border border-[rgba(168,213,186,0.3)] bg-[linear-gradient(145deg,rgba(168,213,186,0.96),rgba(125,190,149,0.85))] px-4 py-5 text-center shadow-[0_24px_50px_rgba(70,122,91,0.28)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#173523]/70">
            Current Balance
          </p>
          <p className="hero-number mt-2 text-[#101913]">{formatCurrency(summary.totalCollected)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
