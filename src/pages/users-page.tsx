import { useState, useMemo, useCallback } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserCard } from "@/components/users/user-card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { PaymentEntryModal } from "@/components/users/payment-entry-modal";
import { UserFilters } from "@/components/users/user-filters";
import type { SexFilter, StatusFilter, SortOption } from "@/components/users/user-filters";
import { SkeletonUsers } from "@/components/common/skeleton-users";
import { exportBulkBalancePDF } from "@/lib/export-balance";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import { useRefreshOnFocus } from "@/hooks/use-refresh-on-focus";
import noSignalSvg from "@/assets/illustrations/no-signal.svg";
import type { StudentWithBalance } from "@/types";

export default function UsersPage() {
  const config = useLedgerStore((s) => s.config);
  const { students, loading, add, edit, remove, refetch: refetchStudents } = useStudents(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { studentsWithBalance, totalExpected } = useLedgerMath(students, totals, overrides);

  const refreshAll = useCallback(() => {
    refetchStudents();
    refetchTotals();
  }, [refetchStudents, refetchTotals]);

  useRefreshOnFocus(refreshAll);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithBalance | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<StudentWithBalance | null>(null);

  const [sexFilter, setSexFilter] = useState<SexFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("name-asc");

  const filtered = useMemo(() => {
    let result = [...studentsWithBalance];

    if (sexFilter !== "all") {
      result = result.filter((s) => s.sex === sexFilter);
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }

    result.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sort === "name-asc" ? cmp : -cmp;
    });

    return result;
  }, [studentsWithBalance, sexFilter, statusFilter, sort]);

  if (loading) return <SkeletonUsers />;

  return (
    <div className="animate-page-enter mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Students ({students.length})
        </h2>
        <div className="flex gap-2">
          {config && studentsWithBalance.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportBulkBalancePDF(
                  studentsWithBalance,
                  config.name,
                  totalExpected,
                  config.deposit_amount
                )
              }
            >
              <Download className="mr-1 h-4 w-4" />
              Report
            </Button>
          )}
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <UserFilters
        sexFilter={sexFilter}
        statusFilter={statusFilter}
        sort={sort}
        onSexFilterChange={setSexFilter}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSort}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
          {studentsWithBalance.length === 0 ? (
            <>
              <img src={noSignalSvg} alt="" className="mb-4 h-32 w-32 opacity-70" />
              <p>No students yet.</p>
              <p className="text-sm">Add your first student to get started.</p>
            </>
          ) : (
            <p className="text-sm">No students match the current filters.</p>
          )}
        </div>
      ) : (
        <div className="animate-stagger-in space-y-2">
          {filtered.map((student) => (
            <UserCard
              key={student.id}
              student={student}
              onClick={() => {
                setSelectedStudent(student);
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

      {config && editStudent && (
        <UserFormDialog
          open={!!editStudent}
          onOpenChange={(open) => {
            if (!open) setEditStudent(null);
          }}
          student={editStudent}
          ledgerId={config.id}
          onSubmit={async (data) => {
            await edit(editStudent.id, data);
          }}
        />
      )}

      {selectedStudent && config && (
        <PaymentEntryModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          student={selectedStudent}
          onPaymentAdded={refetchTotals}
          onEdit={(student) => {
            setPaymentOpen(false);
            setEditStudent(student);
          }}
          onDelete={async (id) => {
            await remove(id, { ledgerId: config.id, name: selectedStudent.name });
            await refetchTotals();
            setPaymentOpen(false);
            setSelectedStudent(null);
          }}
          ledgerName={config.name}
          depositAmount={config.deposit_amount}
          totalExpected={totalExpected}
        />
      )}
    </div>
  );
}
