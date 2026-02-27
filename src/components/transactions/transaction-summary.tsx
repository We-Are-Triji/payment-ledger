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
      <span className="text-sm font-semibold">
        Period Total: {formatCurrency(total)}
      </span>
      <span className="mx-2 text-muted-foreground">·</span>
      <span className="text-sm text-muted-foreground">
        {count} Transaction{count !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
