import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DAY_NAMES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { createBackup } from "@/api/backups";
import { Loader2, AlertTriangle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { LedgerConfig } from "@/types";

interface DangerousSettingsProps {
  config: LedgerConfig;
  onUpdate: (updates: Partial<{ week_filter: Record<number, boolean>; deposit_amount: number }>) => Promise<void>;
}

export function DangerousSettings({ config, onUpdate }: DangerousSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [weekFilter, setWeekFilter] = useState<Record<number, boolean>>({
    ...config.week_filter,
  });
  const [depositAmount, setDepositAmount] = useState(String(config.deposit_amount));
  const [saving, setSaving] = useState(false);
  const [confirmWeekFilter, setConfirmWeekFilter] = useState(false);
  const [confirmDeposit, setConfirmDeposit] = useState(false);

  const weekFilterChanged = JSON.stringify(weekFilter) !== JSON.stringify(config.week_filter);
  const depositParsed = parseFloat(depositAmount);
  const depositChanged = !isNaN(depositParsed) && depositParsed !== config.deposit_amount;

  const toggleDay = (day: number) => {
    setWeekFilter((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSaveWeekFilter = async () => {
    const hasActiveDay = Object.values(weekFilter).some(Boolean);
    if (!hasActiveDay) {
      toast.error("At least one day must be enabled");
      return;
    }

    try {
      setSaving(true);
      await createBackup(config, "Before claiming days change");
      await onUpdate({ week_filter: weekFilter });
      toast.success("Claiming days updated");
    } catch {
      toast.error("Failed to update claiming days");
    } finally {
      setSaving(false);
      setConfirmWeekFilter(false);
    }
  };

  const handleSaveDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Deposit amount must be greater than 0");
      return;
    }

    try {
      setSaving(true);
      await createBackup(config, "Before deposit amount change");
      await onUpdate({ deposit_amount: amount });
      toast.success("Daily deposit updated");
    } catch {
      toast.error("Failed to update daily deposit");
    } finally {
      setSaving(false);
      setConfirmDeposit(false);
    }
  };

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-destructive/30">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="flex-1">Sensitive Settings</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Changes here affect all calculations and balances
              </p>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Claiming Days</Label>
                <div className="flex gap-1">
                  {DAY_NAMES.map((dayName, index) => (
                    <Toggle
                      key={index}
                      pressed={weekFilter[index]}
                      onPressedChange={() => toggleDay(index)}
                      className="flex-1 text-xs"
                      size="sm"
                    >
                      {dayName}
                    </Toggle>
                  ))}
                </div>
                {weekFilterChanged && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setConfirmWeekFilter(true)}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Claiming Days
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Daily Deposit ({formatCurrency(config.deposit_amount)})</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
                {depositChanged && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => setConfirmDeposit(true)}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Daily Deposit
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <ConfirmDialog
        open={confirmWeekFilter}
        onOpenChange={setConfirmWeekFilter}
        title="Change Claiming Days?"
        description="Changing claiming days will recalculate Total Expected for all students. This affects all balances. A backup will be created automatically. Continue?"
        onConfirm={handleSaveWeekFilter}
        confirmLabel="Update Claiming Days"
        destructive
      />

      <ConfirmDialog
        open={confirmDeposit}
        onOpenChange={setConfirmDeposit}
        title="Change Daily Deposit?"
        description="Changing the daily deposit amount will recalculate all expected totals. This is a significant change. A backup will be created automatically. Continue?"
        onConfirm={handleSaveDeposit}
        confirmLabel="Update Deposit"
        destructive
      />
    </>
  );
}
