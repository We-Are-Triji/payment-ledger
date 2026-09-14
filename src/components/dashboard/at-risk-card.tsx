import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import type { ContributorWithBalance } from "@/types";

interface AtRiskCardProps {
  contributorsWithBalance: ContributorWithBalance[];
  depositAmount: number;
}

const MAX_SHOWN = 5;

export function AtRiskCard({ contributorsWithBalance, depositAmount }: AtRiskCardProps) {
  const atRisk = useMemo(() => {
    return contributorsWithBalance
      .filter((c) => c.balance < 0)
      .sort((a, b) => a.balance - b.balance);
  }, [contributorsWithBalance]);

  const shown = atRisk.slice(0, MAX_SHOWN);
  const remaining = atRisk.length - MAX_SHOWN;

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
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
            All contributors are on track.
          </p>
        ) : (
          <div className="space-y-2">
            {shown.map((s) => {
              const { bg, text } = getAvatarColor(s.name);
              const initials = getInitials(s.name);
              const daysBehind = depositAmount > 0
                ? Math.abs(Math.floor(s.balance / depositAmount))
                : 0;
              return (
                <div key={s.id} className="soft-subpanel flex items-center gap-3 rounded-[24px] p-3">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: bg, color: text }}
                  >
                    {initials}
                  </div>
                  <span className="flex-1 truncate text-sm">{s.name}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums text-[var(--soft-peach)]">
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
