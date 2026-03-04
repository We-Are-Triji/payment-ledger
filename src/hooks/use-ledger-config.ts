import { useState, useEffect, useCallback } from "react";
import {
  getLedgerConfig,
  getLedgerConfigById,
  createLedgerConfig,
  updateLedgerConfig,
  deleteLedgerConfig,
} from "@/api/ledger-config";
import { addLedgerMember } from "@/api/ledger-members";
import { upsertUserPreferences } from "@/api/user-preferences";
import { supabase } from "@/lib/supabase";
import { useLedgerStore } from "@/store/ledger-store";
import type { LedgerConfig, LedgerConfigInsert } from "@/types";

async function fetchUserRole(ledgerId: string): Promise<"owner" | "admin" | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("ledger_members")
    .select("role")
    .eq("ledger_id", ledgerId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.role as "owner" | "admin") ?? null;
}

export function useLedgerConfig() {
  const { config, setConfig, activeLedgerId, setActiveLedger } =
    useLedgerStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      if (activeLedgerId) {
        const [data, role] = await Promise.all([
          getLedgerConfigById(activeLedgerId),
          fetchUserRole(activeLedgerId),
        ]);
        setConfig(data);
        setActiveLedger(activeLedgerId, role);
      } else {
        // Backward compat: single-ledger fetch
        const data = await getLedgerConfig();
        setConfig(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, [setConfig, activeLedgerId, setActiveLedger]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const create = useCallback(
    async (data: LedgerConfigInsert): Promise<LedgerConfig> => {
      const result = await createLedgerConfig(data);
      // Insert the creator as owner in ledger_members
      await addLedgerMember(result.id, data.admin_id, "owner");
      // Set as active ledger
      setActiveLedger(result.id, "owner");
      setConfig(result);
      // Update last-used preference
      upsertUserPreferences({ last_ledger_id: result.id }).catch(() => {});
      return result;
    },
    [setConfig, setActiveLedger]
  );

  const update = useCallback(
    async (
      id: string,
      updates: Partial<LedgerConfigInsert>
    ): Promise<LedgerConfig> => {
      const result = await updateLedgerConfig(id, updates);
      setConfig(result);
      return result;
    },
    [setConfig]
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteLedgerConfig(id);
      setConfig(null);
      setActiveLedger(null, null);
    },
    [setConfig, setActiveLedger]
  );

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
    create,
    update,
    remove,
  };
}
