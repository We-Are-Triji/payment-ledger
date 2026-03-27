import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { GlobalSummary } from "@/types";

interface ProgressChartProps {
  summary: GlobalSummary;
}

export function ProgressChart({ summary }: ProgressChartProps) {
  const progress = Math.min(summary.goalProgress, 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker mb-1">Goal Tracker</p>
            <CardTitle className="text-base font-semibold text-white">Payment Goal</CardTitle>
          </div>
          <span className="soft-stat-pill text-xs font-semibold text-[var(--soft-gold)]">
            {formatCurrency(summary.paymentGoal)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid items-center gap-4 pb-0 sm:grid-cols-[156px_1fr]">
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]">
          <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="14"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="url(#goal-gradient)"
              strokeLinecap="round"
              strokeWidth="14"
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
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-full px-4">
            <span className="text-3xl font-bold leading-none tabular-nums text-white">{progress.toFixed(0)}%</span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">toward goal</span>
          </div>
        </div>

        <div className="space-y-3 pb-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {formatCurrency(summary.totalCollected)} raised against a goal of{" "}
              <span className="text-white">{formatCurrency(summary.paymentGoal)}</span>.
            </p>
            <Progress value={progress} />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="soft-subpanel rounded-[16px] p-3.5">
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground/75">Collected</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--soft-mint)]">
                {formatCurrency(summary.totalCollected)}
              </p>
            </div>
            <div className="soft-subpanel rounded-[16px] p-3.5">
              <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground/75">Remaining</p>
              <p className="mt-1.5 text-lg font-bold tabular-nums text-[var(--soft-peach)]">
                {formatCurrency(summary.remaining)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
