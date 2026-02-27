import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserCard } from "@/components/users/user-card";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { PaymentEntryModal } from "@/components/users/payment-entry-modal";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useStudents } from "@/hooks/use-students";
import { usePaymentTotals } from "@/hooks/use-payments";
import { useCalendar } from "@/hooks/use-calendar";
import { useLedgerMath } from "@/hooks/use-ledger-math";
import type { StudentWithBalance } from "@/types";

export default function UsersPage() {
  const config = useLedgerStore((s) => s.config);
  const { students, loading, add } = useStudents(config?.id);
  const { totals, refetch: refetchTotals } = usePaymentTotals(config?.id);
  const { overrides } = useCalendar(config?.id);
  const { studentsWithBalance } = useLedgerMath(students, totals, overrides);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithBalance | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Students ({students.length})
        </h2>
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {studentsWithBalance.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p>No students yet.</p>
          <p className="text-sm">Add your first student to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {studentsWithBalance.map((student) => (
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

      {selectedStudent && (
        <PaymentEntryModal
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          student={selectedStudent}
          onPaymentAdded={refetchTotals}
        />
      )}
    </div>
  );
}
