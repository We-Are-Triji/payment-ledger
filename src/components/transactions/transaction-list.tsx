import { TransactionItem } from "./transaction-item";
import type { PaymentWithStudent } from "@/types";

interface TransactionListProps {
  payments: PaymentWithStudent[];
}

export function TransactionList({ payments }: TransactionListProps) {
  if (payments.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <TransactionItem key={payment.id} payment={payment} />
      ))}
    </div>
  );
}
