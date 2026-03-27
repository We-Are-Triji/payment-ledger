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
    <div className="soft-panel rounded-[28px] p-5 text-center">
      <p className="section-kicker mb-2">Period Total</p>
      <p className="text-3xl font-bold tabular-nums text-white">
        {formatCurrency(total)}
      </p>
      <p className="mt-2 text-sm tabular-nums text-muted-foreground">
        {count} Transaction{count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
