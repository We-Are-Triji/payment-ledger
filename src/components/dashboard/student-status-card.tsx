import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentWithBalance } from "@/types";

interface StudentStatusCardProps {
  studentsWithBalance: StudentWithBalance[];
}

export function StudentStatusCard({ studentsWithBalance }: StudentStatusCardProps) {
  const counts = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let unpaid = 0;
    for (const s of studentsWithBalance) {
      if (s.status === "paid") paid++;
      else if (s.status === "partial") partial++;
      else unpaid++;
    }
    return { paid, partial, unpaid };
  }, [studentsWithBalance]);

  const total = studentsWithBalance.length;
  const barSegments = [
    { count: counts.paid, color: "var(--soft-mint)", label: "Paid" },
    { count: counts.partial, color: "var(--soft-gold)", label: "Partial" },
    { count: counts.unpaid, color: "var(--soft-peach)", label: "Unpaid" },
  ].filter((segment) => segment.count > 0);

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Member Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {total > 0 ? (
          <div className="flex h-3.5 overflow-hidden rounded-full bg-white/[0.05]">
            {barSegments.map((segment) => (
              <div
                key={segment.label}
                className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${(segment.count / total) * 100}%`,
                  backgroundColor: segment.color,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="h-3.5 rounded-full bg-white/[0.06]" />
        )}

        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
          <StatusLabel color="var(--soft-mint)" count={counts.paid} label="Paid" />
          <StatusLabel color="var(--soft-gold)" count={counts.partial} label="Partial" />
          <StatusLabel color="var(--soft-peach)" count={counts.unpaid} label="Unpaid" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusLabel({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="soft-subpanel flex items-center justify-center gap-2 rounded-[20px] px-3 py-2.5">
      <span
        className="inline-flex h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="font-semibold text-white">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
