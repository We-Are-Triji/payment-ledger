import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { GlobalSummary, Payment } from "@/types";

interface GoalProjectionCardProps {
  summary: GlobalSummary;
  payments: Payment[];
  validClassDays: Date[];
}

export function GoalProjectionCard({
  summary,
  payments,
  validClassDays,
}: GoalProjectionCardProps) {
  const projection = useMemo(() => {
    if (summary.remaining <= 0) {
      return { type: "reached" as const };
    }

    if (payments.length === 0 || validClassDays.length === 0) {
      return { type: "no-data" as const };
    }

    const totalCollected = summary.totalCollected;
    const avgPerClassDay = totalCollected / validClassDays.length;

    if (avgPerClassDay <= 0) {
      return { type: "no-data" as const };
    }

    const classDaysNeeded = Math.ceil(summary.remaining / avgPerClassDay);
    const projectedDate = addDays(new Date(), classDaysNeeded);

    return {
      type: "projected" as const,
      date: projectedDate,
      avgDaily: avgPerClassDay,
      daysNeeded: classDaysNeeded,
    };
  }, [summary, payments, validClassDays]);

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Goal Projection</CardTitle>
      </CardHeader>
      <CardContent>
        {projection.type === "reached" ? (
          <div className="flex items-center gap-2 py-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium">Goal reached!</p>
              <p className="text-xs text-muted-foreground">
                Collected {formatCurrency(summary.totalCollected)} of{" "}
                {formatCurrency(summary.paymentGoal)}
              </p>
            </div>
          </div>
        ) : projection.type === "no-data" ? (
          <div className="flex items-center gap-2 py-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Not enough data to project.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm">
                Goal by{" "}
                <span className="font-medium">
                  {format(projection.date, "MMM d, yyyy")}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                ~{projection.daysNeeded} class days · Avg.{" "}
                {formatCurrency(projection.avgDaily)}/day
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
