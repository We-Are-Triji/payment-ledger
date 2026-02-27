import { useState, useEffect, useCallback } from "react";
import { getLedgerConfig, createLedgerConfig, updateLedgerConfig } from "@/api/ledger-config";
import { useLedgerStore } from "@/store/ledger-store";
import type { LedgerConfig, LedgerConfigInsert } from "@/types";

export function useLedgerConfig() {
  const { config, setConfig } = useLedgerStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLedgerConfig();
      setConfig(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  }, [setConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const create = useCallback(
    async (data: LedgerConfigInsert): Promise<LedgerConfig> => {
      const result = await createLedgerConfig(data);
      setConfig(result);
      return result;
    },
    [setConfig]
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

  return { config, loading, error, refetch: fetchConfig, create, update };
}
