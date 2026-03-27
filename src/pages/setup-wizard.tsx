import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { useAuthStore } from "@/store/auth-store";
import { useLedgerConfig } from "@/hooks/use-ledger-config";
import { DAY_NAMES, DEFAULT_WEEK_FILTER } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function SetupWizard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { create } = useLedgerConfig();
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [weekFilter, setWeekFilter] = useState<Record<number, boolean>>({
    ...DEFAULT_WEEK_FILTER,
  });
  const [paymentGoal, setPaymentGoal] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const toggleDay = (day: number) => {
    setWeekFilter((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error("Please enter a ledger name");
      return;
    }

    const deposit = parseFloat(depositAmount);
    if (isNaN(deposit) || deposit <= 0) {
      toast.error("Deposit amount must be greater than 0");
      return;
    }

    const goal = parseFloat(paymentGoal);
    if (isNaN(goal) || goal < 0) {
      toast.error("Payment goal must be 0 or greater");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    const hasActiveDay = Object.values(weekFilter).some(Boolean);
    if (!hasActiveDay) {
      toast.error("At least one day must be enabled in the week filter");
      return;
    }

    try {
      setSubmitting(true);
      await create({
        name: name.trim(),
        deposit_amount: deposit,
        week_filter: weekFilter,
        payment_goal: goal,
        start_date: startDate,
        admin_id: user.id,
      });
      toast.success("Ledger created successfully!");
      navigate("/");
    } catch {
      toast.error("Failed to create ledger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="screen-shell">
      <Card className="screen-card w-full max-w-md">
        <CardHeader className="text-center">
          <p className="section-kicker">New Ledger</p>
          <CardTitle className="text-3xl">Set Up Your Ledger</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure the numbers and cadence before you invite everyone in.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ledger-name">Ledger Name</Label>
              <Input
                id="ledger-name"
                placeholder="e.g., BSCS 3A Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Daily Deposit Amount (₱)</Label>
              <Input
                id="deposit-amount"
                type="number"
                inputMode="numeric"
                min="1"
                step="0.01"
                placeholder="e.g., 10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Claiming Days</Label>
              <div className="flex flex-wrap gap-2">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-goal">Payment Goal (₱)</Label>
              <Input
                id="payment-goal"
                type="number"
                inputMode="numeric"
                min="0"
                step="0.01"
                placeholder="e.g., 5000"
                value={paymentGoal}
                onChange={(e) => setPaymentGoal(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date (Epoch)</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Ledger
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
