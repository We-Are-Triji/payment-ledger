import { formatCurrency } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";

interface TransactionSummaryProps {
  payments: PaymentWithStudent[];
}

export function TransactionSummary({ payments }: TransactionSummaryProps) {
  const active = payments.filter((p) => !p.voided_at);
  const total = active.reduce((sum, p) => sum + p.amount, 0);
  const count = active.length;

  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">
        Period Total:{" "}
      </span>
      <span className="text-sm font-bold tabular-nums">
        {formatCurrency(total)}
      </span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-sm tabular-nums text-muted-foreground">
        {count} Transaction{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
