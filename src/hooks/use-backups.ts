import { useState, useEffect, useCallback } from "react";
import {
  listBackups,
  createBackup,
  deleteBackup,
  downloadBackup,
  restoreBackup,
} from "@/api/backups";
import type { Backup, BackupData, LedgerConfig } from "@/types";

export function useBackups(config: LedgerConfig | null) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!config) return;
    try {
      setLoading(true);
      const data = await listBackups(config.id);
      setBackups(data);
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const create = useCallback(
    async (label: string): Promise<Backup | null> => {
      if (!config) throw new Error("No config");
      const backup = await createBackup(config, label);
      await fetch();
      return backup;
    },
    [config, fetch]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteBackup(id, config?.id);
      await fetch();
    },
    [config, fetch]
  );

  const download = useCallback(async (id: string): Promise<BackupData> => {
    return downloadBackup(id);
  }, []);

  const restore = useCallback(
    async (data: BackupData) => {
      if (!config) throw new Error("No config");
      await restoreBackup(data, config);
    },
    [config]
  );

  const autoBackupIfNeeded = useCallback(async () => {
    if (!config) return;
    try {
      const existing = await listBackups(config.id);
      if (existing.length === 0) {
        await createBackup(config, `Auto - ${new Date().toLocaleDateString("en-PH")}`);
        return;
      }

      const latest = existing[0];
      const daysSince =
        (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince >= 7) {
        await createBackup(config, `Auto - ${new Date().toLocaleDateString("en-PH")}`);
      }
    } catch {
      // Silent fail for auto-backup
    }
  }, [config]);

  return { backups, loading, create, remove, download, restore, refetch: fetch, autoBackupIfNeeded };
}
