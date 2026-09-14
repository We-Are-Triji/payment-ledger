import { useState, useMemo, useCallback } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserCard } from "@/components/users/user-card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { PaymentEntryModal } from "@/components/users/payment-entry-modal";
import { UserFilters } from "@/components/users/user-filters";
import type { StatusFilter, SortOption } from "@/components/users/user-filters";
import { SkeletonUsers } from "@/components/common/skeleton-users";
import { exportBulkBalancePDF } from "@/lib/export-balance";
import { useLedgerStore } from "@/store/ledger-store";
import { useContributors } from "@/hooks/use-contributors";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import noSignalSvg from "@/assets/illustrations/no-signal.svg";
import type { ContributorWithBalance } from "@/types";

export default function UsersPage() {
  const config = useLedgerStore((s) => s.config);
  const { contributors, loading, add, edit, remove, refetch: refetchContributors } = useContributors(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { contributorsWithBalance, totalExpected } = useLedgerMath(contributors, totals, overrides);

  const refreshAll = useCallback(() => {
    refetchContributors();
    refetchTotals();
  }, [refetchContributors, refetchTotals]);

  useRefreshOnFocus(refreshAll);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<ContributorWithBalance | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editContributor, setEditContributor] = useState<ContributorWithBalance | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const filtered = useMemo(() => {
    let result = [...contributorsWithBalance];

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sort === "name-asc" ? cmp : -cmp;
    });

    return result;
  }, [contributorsWithBalance, statusFilter, sort]);

  if (loading) return <SkeletonUsers />;

  return (
    <div className="page-shell animate-page-enter">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0 max-w-sm">
          <p className="section-kicker mb-2">People & Balances</p>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Contributors ({contributors.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick access to balances, payment history, and profile actions.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start justify-end sm:self-end">
          {config && contributorsWithBalance.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              aria-label="Download contributor report"
              onClick={() =>
                exportBulkBalancePDF(
                  contributorsWithBalance,
                  config.name,
                  totalExpected,
                  config.deposit_amount
                )
              }
            >
              <Download className="mr-1 h-4 w-4" />
              <span className="max-[420px]:hidden">Report</span>
            </Button>
          )}
          <Button size="sm" aria-label="Add contributor" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            <span className="max-[420px]:hidden">Add</span>
          </Button>
        </div>
      </div>

      <UserFilters
        statusFilter={statusFilter}
        sort={sort}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSort}
      />

      {filtered.length === 0 ? (
        <div className="soft-empty-state flex flex-col items-center text-muted-foreground">
          {contributorsWithBalance.length === 0 ? (
            <>
              <img src={noSignalSvg} alt="" className="mb-4 h-32 w-32 opacity-70" />
              <p>No contributors yet.</p>
              <p className="text-sm">Add your first contributor to get started.</p>
            </>
          ) : (
            <p className="text-sm">No contributors match the current filters.</p>
          )}
        </div>
      ) : (
        <div className="animate-stagger-in space-y-3">
          {filtered.map((contributor) => (
            <UserCard
              key={contributor.id}
              contributor={contributor}
              onClick={() => {
                setSelectedContributor(contributor);
                setPaymentOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {config && (
        <UserFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          ledgerId={config.id}
          onSubmit={async (data) => {
            await add(data as Parameters<typeof add>[0]);
          }}
        />
      )}

      {config && editContributor && (
        <UserFormDialog
          open={!!editContributor}
          onOpenChange={(open) => {
            if (!open) setEditContributor(null);
          }}
          contributor={editContributor}
          ledgerId={config.id}
          onSubmit={async (data) => {
            await edit(editContributor.id, data);
          }}
        />
      )}

      {selectedContributor && config && (
        <PaymentEntryModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          contributor={selectedContributor}
          onPaymentAdded={refetchTotals}
          onEdit={(contributor) => {
            setPaymentOpen(false);
            setEditContributor(contributor);
          }}
          onDelete={async (id) => {
            await remove(id, { ledgerId: config.id, name: selectedContributor.name });
            await refetchTotals();
            setPaymentOpen(false);
            setSelectedContributor(null);
          }}
          ledgerName={config.name}
          depositAmount={config.deposit_amount}
          totalExpected={totalExpected}
        />
      )}
    </div>
  );
}
