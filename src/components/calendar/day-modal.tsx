import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DayPieChart } from "./day-pie-chart";
import { HolidayToggle } from "./holiday-toggle";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { formatDate, formatCurrency } from "@/lib/utils";
import { calculateDaySummary } from "@/lib/ledger-math";
import { usePaymentsByDate } from "@/hooks/use-payments";
import { ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { Student, CalendarOverride } from "@/types";

interface DayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  students: Student[];
  override: CalendarOverride | null;
  depositAmount: number;
  ledgerId: string;
  onToggleOverride: (
    status: "holiday" | "no_class",
    label: string | null
  ) => Promise<void>;
  onRemoveOverride: () => Promise<void>;
}

export function DayModal({
  open,
  onOpenChange,
  date,
  students,
  override,
  depositAmount,
  ledgerId,
  onToggleOverride,
  onRemoveOverride,
}: DayModalProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { payments } = usePaymentsByDate(ledgerId, open ? dateStr : null);
  const [showTransactions, setShowTransactions] = useState(false);

  const summary = calculateDaySummary(
    date,
    students,
    payments.map((p) => ({
      id: p.id,
      student_id: p.student_id,
      amount: p.amount,
      payment_date: p.payment_date,
      created_at: p.created_at,
      recorded_by: p.recorded_by,
    })),
    depositAmount
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formatDate(date)}</DialogTitle>
        </DialogHeader>

        <DayPieChart paid={summary.paid.length} missed={summary.missed.length} />

        <div className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-lg bg-green-50 p-2">
            <p className="font-semibold text-green-700">
              {summary.paid.length}
            </p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </div>
          <div className="rounded-lg bg-red-50 p-2">
            <p className="font-semibold text-red-700">
              {summary.missed.length}
            </p>
            <p className="text-xs text-muted-foreground">Missed</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Collected: {formatCurrency(summary.totalCollected)} /{" "}
          {formatCurrency(summary.expectedForDay)}
        </p>

        <Separator />

        <div>
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setShowTransactions(!showTransactions)}
          >
            Transactions ({payments.length})
            {showTransactions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          {showTransactions && (
            <div className="mt-2 space-y-2">
              {payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No transactions for this day
                </p>
              ) : (
                payments.map((p) => (
                  <TransactionItem key={p.id} payment={p} />
                ))
              )}
            </div>
          )}
        </div>

        <Separator />

        <HolidayToggle
          date={date}
          override={override}
          ledgerId={ledgerId}
          onToggle={onToggleOverride}
          onRemove={onRemoveOverride}
        />
      </DialogContent>
    </Dialog>
  );
}
