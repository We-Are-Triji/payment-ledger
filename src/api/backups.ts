import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { createThrottle } from "@/lib/sanitize";
import type { Backup, BackupData, LedgerConfig } from "@/types";

const throttleBackup = createThrottle(5000);

export async function listBackups(ledgerId: string): Promise<Backup[]> {
  const { data, error } = await supabase
    .from("backups")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** Deterministic fingerprint of backup data for dedup comparison. */
function computeFingerprint(data: BackupData): string {
  const normalized = JSON.stringify({
    config: {
      name: data.ledger_config.name,
      deposit_amount: data.ledger_config.deposit_amount,
      week_filter: data.ledger_config.week_filter,
      payment_goal: data.ledger_config.payment_goal,
      start_date: data.ledger_config.start_date,
    },
    students: [...data.students].sort((a, b) => a.id.localeCompare(b.id)),
    payments: [...data.payments].sort((a, b) => a.id.localeCompare(b.id)),
    overrides: [...data.calendar_overrides].sort((a, b) => a.id.localeCompare(b.id)),
  });
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = ((hash << 5) - hash + normalized.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

export async function createBackup(
  config: LedgerConfig,
  label: string
): Promise<Backup | null> {
  throttleBackup();
  // Gather all data including audit logs
  const [contributorsRes, paymentsRes, overridesRes, auditRes] =
    await Promise.all([
      supabase.from("contributors").select("*").eq("ledger_id", config.id),
      supabase
        .from("payments")
        .select("*, contributor:contributors!inner(ledger_id)")
        .eq("contributor.ledger_id", config.id),
      supabase
        .from("calendar_overrides")
        .select("*")
        .eq("ledger_id", config.id),
      supabase
        .from("audit_log")
        .select("*")
        .eq("ledger_id", config.id)
        .order("created_at", { ascending: true }),
    ]);

  if (contributorsRes.error) throw contributorsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (overridesRes.error) throw overridesRes.error;
  if (auditRes.error) throw auditRes.error;

  const payments = paymentsRes.data.map(({ contributor: _c, ...rest }) => rest);

  const backupData: BackupData = {
    version: 1,
    created_at: new Date().toISOString(),
    ledger_config: config,
    // JSON key kept as "students" for backup-file backwards compatibility.
    students: contributorsRes.data,
    payments,
    calendar_overrides: overridesRes.data,
    audit_logs: auditRes.data,
  };

  // Dedup: compare with latest backup
  const existing = await listBackups(config.id);
  if (existing.length > 0) {
    try {
      const latestData = await downloadBackup(existing[0].id);
      if (computeFingerprint(latestData) === computeFingerprint(backupData)) {
        return null; // No changes since last backup
      }
    } catch {
      // If download fails, proceed with creating backup
    }
  }

  // Create metadata row
  const { data: backup, error: insertError } = await supabase
    .from("backups")
    .insert({ ledger_id: config.id, label })
    .select()
    .single();
  if (insertError) throw insertError;

  // Upload JSON to storage
  const blob = new Blob([JSON.stringify(backupData)], {
    type: "application/json",
  });
  const { error: uploadError } = await supabase.storage
    .from("ledger-backups")
    .upload(`${backup.id}.json`, blob, { upsert: true });
  if (uploadError) throw uploadError;

  // Enforce max 5 backups
  await enforceBackupLimit(config.id);

  logAuditEvent({
    ledgerId: config.id,
    eventType: "backup.create",
    description: `Created backup "${label}"`,
    metadata: { backupId: backup.id, label },
  });

  return backup;
}

async function enforceBackupLimit(ledgerId: string): Promise<void> {
  const { data } = await supabase
    .from("backups")
    .select("id")
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: false });

  if (!data || data.length <= 5) return;

  const toDelete = data.slice(5);
  for (const backup of toDelete) {
    await deleteBackup(backup.id);
  }
}

export async function deleteBackup(
  backupId: string,
  ledgerId?: string
): Promise<void> {
  // Delete DB record first (authoritative), then storage file
  // If storage delete fails, orphan is a file (not metadata)
  const { error } = await supabase.from("backups").delete().eq("id", backupId);
  if (error) throw error;
  await supabase.storage.from("ledger-backups").remove([`${backupId}.json`]);
  if (ledgerId) {
    logAuditEvent({
      ledgerId,
      eventType: "backup.delete",
      description: "Deleted backup",
      metadata: { backupId },
    });
  }
}

export async function downloadBackup(backupId: string): Promise<BackupData> {
  const { data, error } = await supabase.storage
    .from("ledger-backups")
    .download(`${backupId}.json`);
  if (error) throw error;
  const text = await data.text();
  return JSON.parse(text) as BackupData;
}

export async function restoreBackup(
  backupData: BackupData,
  currentConfig: LedgerConfig
): Promise<void> {
  throttleBackup();
  // Atomic restore via server-side RPC — entire operation runs
  // in a single PostgreSQL transaction. If any step fails, all
  // changes are rolled back automatically.
  const { error } = await supabase.rpc("restore_backup", {
    p_ledger_id: currentConfig.id,
    p_config: backupData.ledger_config,
    p_students: backupData.students,
    p_payments: backupData.payments,
    p_overrides: backupData.calendar_overrides,
    p_audit_logs: backupData.audit_logs ?? [],
  });
  if (error) throw error;
  logAuditEvent({
    ledgerId: currentConfig.id,
    eventType: "backup.restore",
    description: `Restored backup from ${new Date(backupData.created_at).toLocaleDateString("en-PH")}`,
    metadata: { contributorsCount: backupData.students.length, paymentsCount: backupData.payments.length },
  });
}
