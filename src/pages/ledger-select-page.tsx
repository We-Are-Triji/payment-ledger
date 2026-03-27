import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getUserLedgers } from "@/api/ledger-config";
import { upsertUserPreferences } from "@/api/user-preferences";
import { useUserPreferences } from "@/hooks/use-user-preferences";
import { useLedgerStore } from "@/store/ledger-store";
import { Plus, BookOpen } from "lucide-react";
import type { LedgerWithRole } from "@/types";

export default function LedgerSelectPage() {
  const navigate = useNavigate();
  const { setActiveLedger, setConfig } = useLedgerStore();
  const { preferences, loading: prefsLoading, update: updatePrefs } =
    useUserPreferences();
  const [ledgers, setLedgers] = useState<LedgerWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRedirected, setAutoRedirected] = useState(false);

  const fetchLedgers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserLedgers();
      setLedgers(data);
      return data;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLedgers();
  }, [fetchLedgers]);

  // Auto-redirect if user disabled the selector
  useEffect(() => {
    if (prefsLoading || loading || autoRedirected) return;
    if (
      preferences &&
      !preferences.show_ledger_selector &&
      preferences.last_ledger_id
    ) {
      const lastLedger = ledgers.find(
        (l) => l.id === preferences.last_ledger_id
      );
      if (lastLedger) {
        setAutoRedirected(true);
        setActiveLedger(lastLedger.id, lastLedger.role as "owner" | "admin");
        setConfig(null); // Will be fetched by LedgerGuard
        navigate("/", { replace: true });
      }
    }
  }, [
    preferences,
    prefsLoading,
    loading,
    ledgers,
    autoRedirected,
    setActiveLedger,
    setConfig,
    navigate,
  ]);

  const handleSelect = async (ledger: LedgerWithRole) => {
    setActiveLedger(ledger.id, ledger.role as "owner" | "admin");
    setConfig(null); // Will be fetched by LedgerGuard
    upsertUserPreferences({ last_ledger_id: ledger.id }).catch(() => {});
    navigate("/", { replace: true });
  };

  const handleToggle = async (checked: boolean) => {
    await updatePrefs({ show_ledger_selector: checked });
  };

  if (loading || prefsLoading) return <LoadingSpinner />;

  return (
    <div className="screen-shell">
      <Card className="screen-card w-full max-w-md">
        <CardHeader className="text-center">
          <p className="section-kicker">Workspace Picker</p>
          <CardTitle className="text-3xl">Your Ledgers</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a ledger to open or create a new one
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ledgers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                You don't have any ledgers yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {ledgers.map((ledger) => (
                <button
                  key={ledger.id}
                  onClick={() => handleSelect(ledger)}
                  className="soft-subpanel flex w-full items-center justify-between rounded-[24px] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{ledger.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ledger.created_at).toLocaleDateString("en-PH")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      ledger.role === "owner" ? "default" : "secondary"
                    }
                  >
                    {ledger.role === "owner" ? "Owner" : "Admin"}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <Button
            className="w-full"
            variant="outline"
            onClick={() => navigate("/setup")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Ledger
          </Button>

          {ledgers.length > 0 && (
            <div className="flex items-center justify-between pt-2">
              <Label
                htmlFor="show-selector"
                className="text-xs text-muted-foreground"
              >
                Show this screen on login
              </Label>
              <Switch
                id="show-selector"
                checked={preferences?.show_ledger_selector ?? true}
                onCheckedChange={handleToggle}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
