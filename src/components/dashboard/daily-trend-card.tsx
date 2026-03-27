import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import type { Payment } from "@/types";

interface DailyTrendCardProps {
  payments: Payment[];
  validClassDays: Date[];
  depositAmount: number;
  studentCount: number;
}

const BAR_HEIGHT = 64;
const BAR_GAP = 6;

export function DailyTrendCard({
  payments,
  validClassDays,
  depositAmount,
  studentCount,
}: DailyTrendCardProps) {
  const expectedPerDay = depositAmount * studentCount;

  const bars = useMemo(() => {
    const recentDays = validClassDays.slice(-7);
    const totals: Record<string, number> = {};
    for (const p of payments) {
      totals[p.payment_date] = (totals[p.payment_date] || 0) + Number(p.amount);
    }
    return recentDays.map((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return {
        date: d,
        label: format(d, "EEE"),
        dayNum: format(d, "d"),
        amount: totals[dateStr] || 0,
      };
    });
  }, [payments, validClassDays]);

  const maxValue = useMemo(() => {
    const maxBar = bars.reduce((max, b) => Math.max(max, b.amount), 0);
    return Math.max(maxBar, expectedPerDay, 1);
  }, [bars, expectedPerDay]);

  if (bars.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-xs text-muted-foreground">
            No class days recorded yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const barWidth = `calc((100% - ${(bars.length - 1) * BAR_GAP}px) / ${bars.length})`;
  const expectedY = BAR_HEIGHT - (expectedPerDay / maxValue) * BAR_HEIGHT;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Collection Trend
          <span className="ml-1 font-normal text-muted-foreground">
            (Last {bars.length} days)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ height: BAR_HEIGHT + 24 }}>
          <svg
            className="absolute inset-x-0 top-0"
            width="100%"
            height={BAR_HEIGHT}
            preserveAspectRatio="none"
          >
            <line
              x1="0"
              y1={expectedY}
              x2="100%"
              y2={expectedY}
              stroke="currentColor"
              className="text-muted-foreground/40"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          </svg>

          <div
            className="flex items-end"
            style={{ height: BAR_HEIGHT, gap: BAR_GAP }}
          >
            {bars.map((bar) => {
              const h = maxValue > 0 ? (bar.amount / maxValue) * BAR_HEIGHT : 0;
              const isAbove = bar.amount >= expectedPerDay;
              return (
                <div
                  key={bar.dayNum}
                  className="flex flex-col items-center"
                  style={{ width: barWidth }}
                >
                  <div className="flex h-full w-full items-end rounded-full bg-white/[0.04] p-1">
                    <div
                      className={`w-full rounded-full transition-all ${
                        isAbove
                          ? "bg-[linear-gradient(180deg,var(--soft-mint),rgba(168,213,186,0.55))]"
                          : "bg-[linear-gradient(180deg,var(--soft-blue),rgba(174,203,235,0.45))]"
                      }`}
                      style={{ height: Math.max(h, 8) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-1.5 flex" style={{ gap: BAR_GAP }}>
            {bars.map((bar) => (
              <div
                key={bar.dayNum}
                className="text-center text-[9px] text-muted-foreground"
                style={{ width: barWidth }}
              >
                {bar.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="inline-block h-px w-3 border-t border-dashed border-muted-foreground/40" />
            Expected: <span className="font-bold tabular-nums">{formatCurrency(expectedPerDay)}</span>/day
          </span>
          <span>
            Avg: <span className="font-bold tabular-nums">{formatCurrency(
              bars.length > 0
                ? bars.reduce((s, b) => s + b.amount, 0) / bars.length
                : 0
            )}</span>/day
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
