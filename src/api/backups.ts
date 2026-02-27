import { supabase } from "@/lib/supabase";
import type { Backup, BackupData, LedgerConfig } from "@/types";

export async function listBackups(ledgerId: string): Promise<Backup[]> {
  const { data, error } = await supabase
    .from("backups")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createBackup(
  config: LedgerConfig,
  label: string
): Promise<Backup> {
  // Gather all data
  const [studentsRes, paymentsRes, overridesRes] = await Promise.all([
    supabase.from("students").select("*").eq("ledger_id", config.id),
    supabase
      .from("payments")
      .select("*, student:students!inner(ledger_id)")
      .eq("student.ledger_id", config.id),
    supabase.from("calendar_overrides").select("*").eq("ledger_id", config.id),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (paymentsRes.error) throw paymentsRes.error;
  if (overridesRes.error) throw overridesRes.error;

  const payments = paymentsRes.data.map(({ student: _s, ...rest }) => rest);

  const backupData: BackupData = {
    version: 1,
    created_at: new Date().toISOString(),
    ledger_config: config,
    students: studentsRes.data,
    payments,
    calendar_overrides: overridesRes.data,
  };

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

export async function deleteBackup(backupId: string): Promise<void> {
  await supabase.storage.from("ledger-backups").remove([`${backupId}.json`]);
  const { error } = await supabase.from("backups").delete().eq("id", backupId);
  if (error) throw error;
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
  const ledgerId = currentConfig.id;

  // Delete all current data (cascade from students deletes payments)
  await supabase.from("calendar_overrides").delete().eq("ledger_id", ledgerId);
  await supabase.from("students").delete().eq("ledger_id", ledgerId);

  // Update config
  const { id: _id, created_at: _ca, updated_at: _ua, admin_id: _aid, ...configUpdates } =
    backupData.ledger_config;
  await supabase
    .from("ledger_config")
    .update(configUpdates)
    .eq("id", ledgerId);

  // Re-insert students with new IDs mapped
  const studentIdMap = new Map<string, string>();
  for (const student of backupData.students) {
    const { id: oldId, created_at: _sca, updated_at: _sua, ...studentData } = student;
    const { data: newStudent, error } = await supabase
      .from("students")
      .insert({ ...studentData, ledger_id: ledgerId })
      .select()
      .single();
    if (error) throw error;
    studentIdMap.set(oldId, newStudent.id);
  }

  // Re-insert payments with mapped student IDs
  if (backupData.payments.length > 0) {
    const paymentRows = backupData.payments
      .map((p) => {
        const newStudentId = studentIdMap.get(p.student_id);
        if (!newStudentId) return null;
        return {
          student_id: newStudentId,
          amount: p.amount,
          payment_date: p.payment_date,
          recorded_by: p.recorded_by,
        };
      })
      .filter(Boolean);

    if (paymentRows.length > 0) {
      const { error } = await supabase.from("payments").insert(paymentRows);
      if (error) throw error;
    }
  }

  // Re-insert calendar overrides
  if (backupData.calendar_overrides.length > 0) {
    const overrideRows = backupData.calendar_overrides.map((o) => ({
      override_date: o.override_date,
      status: o.status,
      label: o.label,
      ledger_id: ledgerId,
    }));

    const { error } = await supabase
      .from("calendar_overrides")
      .insert(overrideRows);
    if (error) throw error;
  }
}
