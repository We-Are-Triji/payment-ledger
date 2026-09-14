import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { TransactionItem } from "./transaction-item";
import noTransactionsSvg from "@/assets/illustrations/no-transactions.svg";
import type { PaymentWithContributor } from "@/types";

interface TransactionListProps {
  payments: PaymentWithContributor[];
  advanceContributorIds: Set<string>;
  onItemClick: (payment: PaymentWithContributor) => void;
}

export function TransactionList({ payments, advanceContributorIds, onItemClick }: TransactionListProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, PaymentWithContributor[]>();
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
      <div className="soft-empty-state flex flex-col items-center text-muted-foreground">
        <img src={noTransactionsSvg} alt="" className="mb-4 h-32 w-32 opacity-70" />
        <p>No transactions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {Array.from(grouped.entries()).map(([dateStr, items]) => (
        <div key={dateStr}>
          <div className="sticky top-[88px] z-10 bg-background/80 py-1.5 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {format(parseISO(dateStr), "EEEE, MMM d")}
            </p>
          </div>
          <div className="space-y-1.5">
            {items.map((payment) => (
              <TransactionItem
                key={payment.id}
                payment={payment}
                isAdvance={advanceContributorIds.has(payment.contributor_id)}
                onClick={() => onItemClick(payment)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
