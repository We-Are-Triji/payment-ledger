import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ContributorWithBalance } from "@/types";

interface ContributorStatusCardProps {
  contributorsWithBalance: ContributorWithBalance[];
}

export function ContributorStatusCard({ contributorsWithBalance }: ContributorStatusCardProps) {
  const counts = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let unpaid = 0;
    for (const c of contributorsWithBalance) {
      if (c.status === "paid") paid++;
      else if (c.status === "partial") partial++;
      else unpaid++;
    }
    return { paid, partial, unpaid };
  }, [contributorsWithBalance]);

  const total = contributorsWithBalance.length;
  const barSegments = [
    { count: counts.paid, color: "var(--soft-mint)", label: "Paid" },
    { count: counts.partial, color: "var(--soft-gold)", label: "Partial" },
    { count: counts.unpaid, color: "var(--soft-peach)", label: "Unpaid" },
  ].filter((segment) => segment.count > 0);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Contributor Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {total > 0 ? (
          <div className="flex h-3 overflow-hidden rounded-[10px] bg-white/[0.05]">
            {barSegments.map((segment) => (
              <div
                key={segment.label}
                className="h-full transition-all"
                style={{
                  width: `${(segment.count / total) * 100}%`,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="h-3 rounded-[10px] bg-white/[0.06]" />
        )}

        <div className="grid grid-cols-3 gap-2 text-xs">
          <StatusLabel color="var(--soft-mint)" count={counts.paid} label="Paid" shortLabel="Paid" />
          <StatusLabel color="var(--soft-gold)" count={counts.partial} label="Partial" shortLabel="Part." />
          <StatusLabel color="var(--soft-peach)" count={counts.unpaid} label="Unpaid" shortLabel="Unpd." />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusLabel({
  color,
  count,
  label,
  shortLabel,
}: {
  color: string;
  count: number;
  label: string;
  shortLabel: string;
}) {
  return (
    <div className="soft-subpanel flex min-w-0 items-center gap-2 rounded-[14px] px-2.5 py-2.5">
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold text-white">{count}</span>
      <span className="min-w-0 truncate text-muted-foreground">
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{shortLabel}</span>
      </span>
    </div>
  );
}
