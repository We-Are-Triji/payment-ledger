import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { UserAvatar } from "@/components/users/user-avatar";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";

interface VoidSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentWithStudent | null;
  onVoid: (id: string) => Promise<void>;
}

export function VoidSheet({ open, onOpenChange, payment, onVoid }: VoidSheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [voiding, setVoiding] = useState(false);

  if (!payment) return null;

  const isVoided = !!payment.voided_at;

  const handleVoid = async () => {
    try {
      setVoiding(true);
      await onVoid(payment.id);
      onOpenChange(false);
    } finally {
      setVoiding(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Transaction Details</SheetTitle>
            <SheetDescription>Review or void this transaction</SheetDescription>
          </SheetHeader>

          <div className="flex items-center gap-3 px-4">
            <UserAvatar
              name={payment.student.name}
              avatarUrl={payment.student.avatar_url}
              className="h-10 w-10"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{payment.student.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(payment.created_at)}
              </p>
            </div>
            <span className="text-lg font-bold text-accent">
              +{formatCurrency(payment.amount)}
            </span>
          </div>

          <SheetFooter>
            {isVoided ? (
              <p className="w-full text-center text-sm text-muted-foreground">
                This transaction has already been voided.
              </p>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                disabled={voiding}
                onClick={() => setConfirmOpen(true)}
              >
                Void Transaction
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Void Transaction"
        description={`This will void the ${formatCurrency(payment.amount)} payment from ${payment.student.name}. This cannot be undone.`}
        onConfirm={handleVoid}
        confirmLabel="Void"
        destructive
      />
    </>
  );
}
