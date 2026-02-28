import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import type { GlobalSummary } from "@/types";

interface MonthlySummaryProps {
  summary: GlobalSummary;
  totalClassDays: number;
  studentCount: number;
}

const RING_SIZE = 64;
const STROKE = 6;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function CollectionRing({ rate }: { rate: number }) {
  const clamped = Math.min(Math.max(rate, 0), 100);
  const offset = CIRCUMFERENCE - (clamped / 100) * CIRCUMFERENCE;
  const color =
    clamped >= 80 ? "text-emerald-500" : clamped >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="relative flex items-center justify-center" style={{ width: RING_SIZE, height: RING_SIZE }}>
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className={`${color} stroke-current transition-[stroke-dashoffset] duration-500`}
        />
      </svg>
      <span className="absolute text-xs font-semibold">{clamped.toFixed(0)}%</span>
    </div>
  );
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
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4">
          <CollectionRing rate={summary.collectionRate} />
          <div className="flex-1 space-y-0.5">
            <p className="text-xs text-muted-foreground">Collection Rate</p>
            <p className="text-sm font-semibold">
              {formatCurrency(summary.totalCollected)}{" "}
              <span className="font-normal text-muted-foreground">
                / {formatCurrency(summary.globalExpected)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.remaining)} remaining
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <SummaryItem label="Class Days" value={String(totalClassDays)} />
          <SummaryItem label="Students" value={String(studentCount)} />
          <SummaryItem
            label="Goal"
            value={formatCurrency(summary.paymentGoal)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-1.5 text-center">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold">{value}</p>
    </div>
  );
}
