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

  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Member Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {total > 0 ? (
          <div className="flex h-4 overflow-hidden rounded-full bg-white/[0.05] p-1">
            {counts.paid > 0 && (
              <div
                className="rounded-full bg-[var(--soft-mint)] transition-all"
                style={{ width: `${(counts.paid / total) * 100}%` }}
              />
            )}
            {counts.partial > 0 && (
              <div
                className="rounded-full bg-[var(--soft-gold)] transition-all"
                style={{ width: `${(counts.partial / total) * 100}%` }}
              />
            )}
            {counts.unpaid > 0 && (
              <div
                className="rounded-full bg-[var(--soft-peach)] transition-all"
                style={{ width: `${(counts.unpaid / total) * 100}%` }}
              />
            )}
          </div>
        ) : (
          <div className="h-4 rounded-full bg-white/[0.06]" />
        )}

        <div className="grid grid-cols-3 gap-3 text-xs">
          <StatusLabel color="bg-[var(--soft-mint)]" count={counts.paid} label="Paid" />
          <StatusLabel color="bg-[var(--soft-gold)]" count={counts.partial} label="Partial" />
          <StatusLabel color="bg-[var(--soft-peach)]" count={counts.unpaid} label="Unpaid" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusLabel({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="soft-subpanel flex items-center justify-center gap-2 rounded-[22px] px-3 py-3">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="font-semibold text-white">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
