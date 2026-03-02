import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { GlobalSummary } from "@/types";

interface ProgressChartProps {
  summary: GlobalSummary;
}

export function ProgressChart({ summary }: ProgressChartProps) {
  const progress = Math.min(summary.goalProgress, 100);

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Payment Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex justify-between text-[9px] uppercase tracking-wider text-muted-foreground/70">
          <span className="tabular-nums">{formatCurrency(summary.totalCollected)}</span>
          <span className="tabular-nums">{formatCurrency(summary.paymentGoal)}</span>
        </div>
        <Progress value={progress} className="h-2.5" />
        <p className="text-center text-[10px] text-muted-foreground">
          <span className="font-bold tabular-nums">{progress.toFixed(1)}%</span> of goal · <span className="font-bold tabular-nums">{formatCurrency(summary.remaining)}</span> remaining
        </p>
      </CardContent>
    </Card>
  );
}
