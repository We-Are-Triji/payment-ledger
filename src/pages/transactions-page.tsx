import { useState } from "react";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { usePaymentsWithStudents } from "@/hooks/use-payments";
import type { TransactionFilter } from "@/types";

export default function TransactionsPage() {
  const config = useLedgerStore((s) => s.config);
  const [filter, setFilter] = useState<TransactionFilter>("today");
  const { payments, loading } = usePaymentsWithStudents(config?.id, filter);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-semibold">Transactions</h2>
      <TransactionFilters value={filter} onChange={setFilter} />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <TransactionList payments={payments} />
      )}
    </div>
  );
}
