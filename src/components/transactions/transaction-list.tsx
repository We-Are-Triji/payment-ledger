import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { TransactionItem } from "./transaction-item";
import type { PaymentWithStudent } from "@/types";

interface TransactionListProps {
  payments: PaymentWithStudent[];
  advanceStudentIds: Set<string>;
  onItemClick: (payment: PaymentWithStudent) => void;
}

export function TransactionList({ payments, advanceStudentIds, onItemClick }: TransactionListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PaymentWithStudent[]>();
    for (const p of payments) {
      const key = p.payment_date;
      const arr = map.get(key);
      if (arr) {
        arr.push(p);
      } else {
        map.set(key, [p]);
      }
    }
    return map;
  }, [payments]);

  if (payments.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {Array.from(grouped.entries()).map(([dateStr, items]) => (
        <div key={dateStr}>
          <div className="sticky top-0 z-10 bg-background py-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {format(parseISO(dateStr), "EEEE, MMM d")}
            </p>
          </div>
          <div className="space-y-1.5">
            {items.map((payment) => (
              <TransactionItem
                key={payment.id}
                payment={payment}
                isAdvance={advanceStudentIds.has(payment.student_id)}
                onClick={() => onItemClick(payment)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
