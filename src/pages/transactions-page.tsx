import { useState, useMemo } from "react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionList } from "@/components/transactions/transaction-list";
import { ExportModal } from "@/components/transactions/export-modal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useTransactions } from "@/hooks/use-payments";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import type { TransactionFilter } from "@/types";

export default function TransactionsPage() {
  const config = useLedgerStore((s) => s.config);
  const [filter, setFilter] = useState<TransactionFilter>("today");

  const { from, to } = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    switch (filter) {
      case "today":
        return { from: todayStr, to: todayStr };
      case "week":
        return { from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: todayStr };
      case "month":
        return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: todayStr };
    }
  }, [filter]);

  const { payments, loading, refetch } = useTransactions(config?.id, from, to);
  const [exportOpen, setExportOpen] = useState(false);

  useRefreshOnFocus(refetch);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Transactions</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setExportOpen(true)}
        >
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>
      <TransactionFilters value={filter} onChange={setFilter} />
      {loading ? (
        <LoadingSpinner />
      ) : (
        <TransactionList payments={payments} />
      )}

      {config && (
        <ExportModal
          open={exportOpen}
          onOpenChange={setExportOpen}
          ledgerId={config.id}
          ledgerName={config.name}
        />
      )}
    </div>
  );
}
