import { useState, useMemo } from "react";
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
import { usePaymentsByDate } from "@/hooks/use-payments";
import { CalendarOff, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import type { Contributor, CalendarOverride } from "@/types";

interface DayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  contributors: Contributor[];
  override: CalendarOverride | null;
  depositAmount: number;
  ledgerId: string;
  coveredContributorIds: Set<string>;
  onToggleOverride: (
    status: "holiday" | "skip_day",
    label: string | null
  ) => Promise<void>;
  onRemoveOverride: () => Promise<void>;
}

export function DayModal({
  open,
  onOpenChange,
  date,
  contributors,
  override,
  depositAmount,
  ledgerId,
  coveredContributorIds,
  onToggleOverride,
  onRemoveOverride,
}: DayModalProps) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { payments } = usePaymentsByDate(ledgerId, open ? dateStr : null);
  const [showTransactions, setShowTransactions] = useState(false);

  const paid = useMemo(
    () => contributors.filter((c) => coveredContributorIds.has(c.id)),
    [contributors, coveredContributorIds]
  );
  const missed = useMemo(
    () => contributors.filter((c) => !coveredContributorIds.has(c.id)),
    [contributors, coveredContributorIds]
  );
  const totalCovered = coveredContributorIds.size * depositAmount;
  const expectedForDay = contributors.length * depositAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formatDate(date)}</DialogTitle>
        </DialogHeader>

        {override ? (
          <div className="soft-empty-state flex flex-col items-center gap-2 py-6 text-muted-foreground">
            <CalendarOff className="h-10 w-10" />
            <p className="text-sm font-medium">Off Day</p>
            <p className="text-xs">This day is marked as a holiday or off day.</p>
          </div>
        ) : (
          <>
            <DayPieChart paid={paid.length} missed={missed.length} />

            <div className="grid grid-cols-2 gap-3 text-center text-sm">
              <div className="soft-subpanel rounded-[22px] p-3">
                <p className="font-semibold text-[var(--soft-mint)]">
                  {paid.length}
                </p>
                <p className="text-xs text-muted-foreground">Covered</p>
              </div>
              <div className="soft-subpanel rounded-[22px] p-3">
                <p className="font-semibold text-[var(--soft-peach)]">
                  {missed.length}
                </p>
                <p className="text-xs text-muted-foreground">Not Covered</p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Covered: {formatCurrency(totalCovered)} /{" "}
              {formatCurrency(expectedForDay)}
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
                      <TransactionItem key={p.id} payment={p} isAdvance={false} onClick={() => {}} />
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}

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
