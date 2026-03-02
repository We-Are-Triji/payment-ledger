import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import type { StudentWithBalance } from "@/types";

interface AtRiskCardProps {
  studentsWithBalance: StudentWithBalance[];
  depositAmount: number;
}

const MAX_SHOWN = 5;

export function AtRiskCard({ studentsWithBalance, depositAmount }: AtRiskCardProps) {
  const atRisk = useMemo(() => {
    return studentsWithBalance
      .filter((s) => s.balance < 0)
      .sort((a, b) => a.balance - b.balance);
  }, [studentsWithBalance]);

  const shown = atRisk.slice(0, MAX_SHOWN);
  const remaining = atRisk.length - MAX_SHOWN;

  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">
          Needs Attention
          {atRisk.length > 0 && (
            <span className="ml-1 font-normal text-muted-foreground">
              ({atRisk.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {shown.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">
            All students are on track.
          </p>
        ) : (
          <div className="space-y-1.5">
            {shown.map((s) => {
              const { bg, text } = getAvatarColor(s.name);
              const initials = getInitials(s.name);
              const daysBehind = depositAmount > 0
                ? Math.abs(Math.floor(s.balance / depositAmount))
                : 0;
              return (
                <div key={s.id} className="flex items-center gap-2.5 rounded-md p-1">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 truncate text-sm">{s.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums text-red-500">
                      {formatCurrency(s.balance)}
                    </span>
                    {daysBehind > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {daysBehind}d behind
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {remaining > 0 && (
              <p className="pt-0.5 text-center text-xs text-muted-foreground">
                +{remaining} more
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
