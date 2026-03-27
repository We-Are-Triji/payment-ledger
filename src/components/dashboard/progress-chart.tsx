import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { GlobalSummary } from "@/types";

interface ProgressChartProps {
  summary: GlobalSummary;
}

export function ProgressChart({ summary }: ProgressChartProps) {
  const progress = Math.min(summary.goalProgress, 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Payment Goal</CardTitle>
      </CardHeader>
      <CardContent className="grid items-center gap-6 sm:grid-cols-[160px_1fr]">
        <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="16"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#goal-gradient)"
              strokeLinecap="round"
              strokeWidth="16"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
            />
            <defs>
              <linearGradient id="goal-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="var(--soft-mint)" />
                <stop offset="55%" stopColor="var(--soft-blue)" />
                <stop offset="100%" stopColor="var(--soft-gold)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full">
            <span className="text-3xl font-bold tabular-nums text-white">{progress.toFixed(0)}%</span>
            <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">toward goal</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {formatCurrency(summary.totalCollected)} raised against a goal of{" "}
              <span className="text-white">{formatCurrency(summary.paymentGoal)}</span>.
            </p>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="soft-subpanel rounded-[24px] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Collected</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-[var(--soft-mint)]">
                {formatCurrency(summary.totalCollected)}
              </p>
            </div>
            <div className="soft-subpanel rounded-[24px] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">Remaining</p>
              <p className="mt-2 text-lg font-bold tabular-nums text-[var(--soft-peach)]">
                {formatCurrency(summary.remaining)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
