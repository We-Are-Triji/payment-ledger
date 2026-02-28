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
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{formatCurrency(summary.totalCollected)}</span>
          <span>{formatCurrency(summary.paymentGoal)}</span>
        </div>
        <Progress value={progress} className="h-2.5" />
        <p className="text-center text-xs text-muted-foreground">
          {progress.toFixed(1)}% of goal · {formatCurrency(summary.remaining)} remaining
        </p>
      </CardContent>
    </Card>
  );
}
