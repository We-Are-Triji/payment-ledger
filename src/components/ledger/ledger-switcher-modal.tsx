import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserLedgers } from "@/api/ledger-config";
import { upsertUserPreferences } from "@/api/user-preferences";
import { useLedgerStore } from "@/store/ledger-store";
import { Loader2, Plus, Check } from "lucide-react";
import type { LedgerWithRole } from "@/types";

interface LedgerSwitcherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LedgerSwitcherModal({
  open,
  onOpenChange,
}: LedgerSwitcherModalProps) {
  const navigate = useNavigate();
  const activeLedgerId = useLedgerStore((s) => s.activeLedgerId);
  const setActiveLedger = useLedgerStore((s) => s.setActiveLedger);
  const [ledgers, setLedgers] = useState<LedgerWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getUserLedgers()
      .then(setLedgers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  const handleSelect = (ledger: LedgerWithRole) => {
    if (ledger.id === activeLedgerId) {
      onOpenChange(false);
      return;
    }
    setActiveLedger(ledger.id, ledger.role);
    upsertUserPreferences({ last_ledger_id: ledger.id }).catch(() => {});
    onOpenChange(false);
    window.location.href = "/";
  };

  const handleCreate = () => {
    onOpenChange(false);
    navigate("/setup");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Your Ledgers</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ledgers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No ledgers yet. Create one to get started.
          </p>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {ledgers.map((ledger) => (
              <button
                key={ledger.id}
                onClick={() => handleSelect(ledger)}
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ledger.name}</p>
                </div>
                <Badge
                  variant={ledger.role === "owner" ? "default" : "secondary"}
                  className="shrink-0 text-xs"
                >
                  {ledger.role === "owner" ? "Owner" : "Admin"}
                </Badge>
                {ledger.id === activeLedgerId && (
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Ledger
        </Button>
      </DialogContent>
    </Dialog>
  );
}
