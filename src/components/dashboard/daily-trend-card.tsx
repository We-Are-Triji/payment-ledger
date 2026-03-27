import { useId, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Payment } from "@/types";

interface DailyTrendCardProps {
  payments: Payment[];
  validClassDays: Date[];
  depositAmount: number;
  studentCount: number;
}

export function DailyTrendCard({
  payments,
  validClassDays,
  depositAmount,
  studentCount,
}: DailyTrendCardProps) {
  const expectedPerDay = depositAmount * studentCount;
  const gradientId = useId();
  const glowId = useId();

  const chartData = useMemo(() => {
    const recentDays = validClassDays.slice(-8);
    const totals: Record<string, number> = {};
    for (const p of payments) {
      totals[p.payment_date] = (totals[p.payment_date] || 0) + Number(p.amount);
    }
    return recentDays.map((d, index, days) => {
      const dateStr = format(d, "yyyy-MM-dd");
      const amount = totals[dateStr] || 0;
      const start = Math.max(0, index - 2);
      const trendWindow = days.slice(start, index + 1).map((windowDay) => {
        const windowKey = format(windowDay, "yyyy-MM-dd");
        return totals[windowKey] || 0;
      });
      const pace =
        trendWindow.reduce((sum, value) => sum + value, 0) / trendWindow.length;

      return {
        dateLabel: format(d, "MMM d"),
        shortLabel: format(d, "EEE"),
        amount,
        pace,
      };
    });
  }, [payments, validClassDays]);

  const averagePerDay = useMemo(
    () =>
      chartData.length > 0
        ? chartData.reduce((sum, day) => sum + day.amount, 0) / chartData.length
        : 0,
    [chartData]
  );

  const bestDay = useMemo(
    () => chartData.reduce((best, day) => (day.amount > best.amount ? day : best), chartData[0] ?? { amount: 0, dateLabel: "-", shortLabel: "-", pace: 0 }),
    [chartData]
  );

  if (chartData.length === 0) {
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="section-kicker mb-1">Recent Momentum</p>
            <CardTitle className="text-base font-semibold text-white">
              Collection Trend
            </CardTitle>
          </div>
          <span className="soft-stat-pill text-xs font-semibold text-[var(--soft-blue)]">
            {formatCurrency(averagePerDay)}/day
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <div className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-2 pb-1 pt-3">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--soft-mint)" stopOpacity={0.5} />
                    <stop offset="60%" stopColor="var(--soft-blue)" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="var(--soft-blue)" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id={glowId} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="var(--soft-mint)" />
                    <stop offset="100%" stopColor="var(--soft-blue)" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 11 }}
                />
                <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax, expectedPerDay, 1) * 1.18]} />
                <ReferenceLine
                  y={expectedPerDay}
                  stroke="rgba(251,228,161,0.7)"
                  strokeDasharray="5 5"
                />
                <Tooltip
                  cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0]?.payload as {
                      dateLabel: string;
                      amount: number;
                      pace: number;
                    };
                    return (
                      <div className="rounded-[16px] border border-white/10 bg-[#1d1d22]/95 px-3 py-2 shadow-[var(--soft-shadow-sm)]">
                        <p className="text-[11px] font-semibold text-white">{point.dateLabel}</p>
                        <p className="mt-1 text-xs text-[var(--soft-mint)]">
                          Collected: {formatCurrency(point.amount)}
                        </p>
                        <p className="text-xs text-[var(--soft-blue)]">
                          Pace: {formatCurrency(point.pace)}
                        </p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={`url(#${glowId})`}
                  fill={`url(#${gradientId})`}
                  strokeWidth={3}
                  activeDot={{ r: 4, fill: "var(--soft-mint)", stroke: "#161618", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="pace"
                  stroke="var(--soft-blue)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="7 6"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <TrendStat label="Target" value={`${formatCurrency(expectedPerDay)}/day`} tone="text-[var(--soft-gold)]" />
          <TrendStat label="Average" value={`${formatCurrency(averagePerDay)}/day`} tone="text-[var(--soft-blue)]" />
          <TrendStat label="Best Day" value={bestDay.dateLabel} tone="text-[var(--soft-mint)]" />
        </div>
      </CardContent>
    </Card>
  );
}

function TrendStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="soft-subpanel rounded-[16px] px-3 py-2.5">
      <p className="truncate text-[10px] uppercase tracking-[0.18em] text-muted-foreground/75">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
