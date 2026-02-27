import { useState, useMemo } from "react";
import { format, subDays, startOfMonth } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionSummary } from "@/components/transactions/transaction-summary";
import { TransactionList } from "@/components/transactions/transaction-list";
import { VoidSheet } from "@/components/transactions/void-sheet";
import { ExportModal } from "@/components/transactions/export-modal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useTransactions, usePaymentTotals, usePaymentActions } from "@/hooks/use-payments";
import { useStudents } from "@/hooks/use-students";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import type { TransactionPreset, PaymentWithStudent } from "@/types";

export default function TransactionsPage() {
  const config = useLedgerStore((s) => s.config);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [preset, setPreset] = useState<TransactionPreset>("today");
  const [customFrom, setCustomFrom] = useState(todayStr);
  const [customTo, setCustomTo] = useState(todayStr);
  const [search, setSearch] = useState("");
  const [showVoided, setShowVoided] = useState(false);
  const [voidTarget, setVoidTarget] = useState<PaymentWithStudent | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const { from, to } = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "today":
        return { from: todayStr, to: todayStr };
      case "yesterday": {
        const y = format(subDays(now, 1), "yyyy-MM-dd");
        return { from: y, to: y };
      }
      case "month":
        return { from: format(startOfMonth(now), "yyyy-MM-dd"), to: todayStr };
      case "custom":
        return { from: customFrom, to: customTo };
    }
  }, [preset, todayStr, customFrom, customTo]);

  const { payments, loading, refetch } = useTransactions(config?.id, from, to);
  const { students } = useStudents(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { studentsWithBalance } = useLedgerMath(students, totals, overrides);
  const { voidTx } = usePaymentActions();

  useRefreshOnFocus(refetch);

  const advanceStudentIds = useMemo(
    () => new Set(studentsWithBalance.filter((s) => s.status === "paid").map((s) => s.id)),
    [studentsWithBalance]
  );

  const filtered = useMemo(() => {
    let result = payments;
    if (!showVoided) result = result.filter((p) => !p.voided_at);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.student.name.toLowerCase().includes(q));
    }
    return result;
  }, [payments, showVoided, search]);

  const handleVoid = async (id: string) => {
    await voidTx(id);
    refetch();
    refetchTotals();
  };

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

      <TransactionFilters
        preset={preset}
        onPresetChange={setPreset}
        search={search}
        onSearchChange={setSearch}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        showVoided={showVoided}
        onShowVoidedChange={setShowVoided}
      />

      <TransactionSummary payments={filtered} />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <TransactionList
          payments={filtered}
          advanceStudentIds={advanceStudentIds}
          onItemClick={setVoidTarget}
        />
      )}

      <VoidSheet
        open={!!voidTarget}
        onOpenChange={(open) => { if (!open) setVoidTarget(null); }}
        payment={voidTarget}
        onVoid={handleVoid}
      />

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
