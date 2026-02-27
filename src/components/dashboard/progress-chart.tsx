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
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Payment Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatCurrency(summary.totalCollected)}
          </span>
          <span className="font-medium">{progress.toFixed(1)}%</span>
          <span className="text-muted-foreground">
            {formatCurrency(summary.paymentGoal)}
          </span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {formatCurrency(summary.remaining)} remaining
        </p>
      </CardContent>
    </Card>
  );
}
