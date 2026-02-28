import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "./user-avatar";
import { useAuthStore } from "@/store/auth-store";
import { useLedgerStore } from "@/store/ledger-store";
import { usePaymentActions } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { StudentWithBalance } from "@/types";

interface PaymentEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentWithBalance;
  onPaymentAdded: () => void;
  onEdit: (student: StudentWithBalance) => void;
  onDelete: (id: string) => Promise<void>;
}

export function PaymentEntryModal({
  open,
  onOpenChange,
  student,
  onPaymentAdded,
  onEdit,
  onDelete,
}: PaymentEntryModalProps) {
  const { user } = useAuthStore();
  const config = useLedgerStore((s) => s.config);
  const { add } = usePaymentActions();
  const [manualAmount, setManualAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const handlePayment = async (amount: number, method: "quick" | "manual") => {
    if (!user || !config) return;

    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      await add({
        student_id: student.id,
        amount,
        payment_date: todayStr,
        recorded_by: user.id,
        method,
      });
      toast.success(
        `Payment of ${formatCurrency(amount)} recorded for ${student.name}`
      );
      setManualAmount("");
      onPaymentAdded();
      onOpenChange(false);
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      await onDelete(student.id);
      toast.success("Student deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) setManualAmount("");
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Payment</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <UserAvatar
            name={student.name}
            avatarUrl={student.avatar_url}
            className="h-12 w-12"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{student.name}</p>
            <p className="text-sm text-muted-foreground">
              Balance: {formatCurrency(student.balance)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              onOpenChange(false);
              onEdit(student);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Quick Add</p>
            <Button
              className="w-full"
              size="lg"
              disabled={submitting}
              onClick={() =>
                config && handlePayment(config.deposit_amount, "quick")
              }
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Add {config ? formatCurrency(config.deposit_amount) : "—"}
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="manual-amount">Manual Entry</Label>
            <div className="flex gap-2">
              <Input
                id="manual-amount"
                type="number"
                inputMode="numeric"
                min="1"
                step="0.01"
                placeholder="Enter amount"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
              />
              <Button
                disabled={submitting || !manualAmount}
                onClick={() => handlePayment(parseFloat(manualAmount), "manual")}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      open={confirmDelete}
      onOpenChange={setConfirmDelete}
      title="Delete Student?"
      description={`This will permanently delete "${student.name}" and all their payment records. This cannot be undone.`}
      onConfirm={handleDelete}
      confirmLabel="Delete"
      destructive
    />
    </>
  );
}
