import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { LedgerConfig } from "@/types";

interface ClassSettingsProps {
  config: LedgerConfig;
  onUpdate: (updates: Partial<{ name: string; payment_goal: number }>) => Promise<void>;
}

export function ClassSettings({ config, onUpdate }: ClassSettingsProps) {
  const [name, setName] = useState(config.name);
  const [goal, setGoal] = useState(String(config.payment_goal));
  const [saving, setSaving] = useState(false);

  const hasNameChange = name.trim() !== config.name;
  const hasGoalChange = parseFloat(goal) !== config.payment_goal;
  const hasChanges = hasNameChange || hasGoalChange;

  const handleSave = async () => {
    const updates: Partial<{ name: string; payment_goal: number }> = {};

    if (hasNameChange) {
      if (!name.trim()) {
        toast.error("Class name cannot be empty");
        return;
      }
      updates.name = name.trim();
    }

    if (hasGoalChange) {
      const goalNum = parseFloat(goal);
      if (isNaN(goalNum) || goalNum < 0) {
        toast.error("Payment goal must be 0 or greater");
        return;
      }
      updates.payment_goal = goalNum;
    }

    try {
      setSaving(true);
      await onUpdate(updates);
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Class Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="class-name">Class Name</Label>
          <Input
            id="class-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Start Date (Epoch)</Label>
          <p className="text-sm text-muted-foreground">
            {formatDate(new Date(config.start_date + "T00:00:00"))}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-goal">Payment Goal</Label>
          <Input
            id="payment-goal"
            type="number"
            inputMode="numeric"
            min="0"
            step="0.01"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
