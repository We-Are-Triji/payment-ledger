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
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium">Member Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {total > 0 ? (
          <div className="flex h-3 overflow-hidden rounded-full">
            {counts.paid > 0 && (
              <div
                className="bg-emerald-400 transition-all"
                style={{ width: `${(counts.paid / total) * 100}%` }}
              />
            )}
            {counts.partial > 0 && (
              <div
                className="bg-[#e8d44d] transition-all"
                style={{ width: `${(counts.partial / total) * 100}%` }}
              />
            )}
            {counts.unpaid > 0 && (
              <div
                className="bg-rose-400 transition-all"
                style={{ width: `${(counts.unpaid / total) * 100}%` }}
              />
            )}
          </div>
        ) : (
          <div className="h-3 rounded-full bg-muted" />
        )}

        <div className="flex justify-between text-xs">
          <StatusLabel color="bg-emerald-500" count={counts.paid} label="Paid" />
          <StatusLabel color="bg-[#e8d44d]" count={counts.partial} label="Partial" />
          <StatusLabel color="bg-red-500" count={counts.unpaid} label="Unpaid" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusLabel({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
      <span className="font-medium">{count}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
