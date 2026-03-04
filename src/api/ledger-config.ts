import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { MAX_NAME_LENGTH } from "@/lib/sanitize";
import type { LedgerConfig, LedgerConfigInsert, LedgerWithRole } from "@/types";

export async function getLedgerConfig(): Promise<LedgerConfig | null> {
  const { data, error } = await supabase
    .from("ledger_config")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLedgerConfigById(id: string): Promise<LedgerConfig | null> {
  const { data, error } = await supabase
    .from("ledger_config")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUserLedgers(): Promise<LedgerWithRole[]> {
  const { data, error } = await supabase.rpc("get_user_ledgers");
  if (error) throw error;
  return (data as LedgerWithRole[]) ?? [];
}

export async function createLedgerConfig(
  config: LedgerConfigInsert
): Promise<LedgerConfig> {
  if (config.name && config.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("ledger_config")
    .insert(config)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.id,
    eventType: "config.create",
    description: `Created ledger "${data.name}"`,
    metadata: { depositAmount: data.deposit_amount, startDate: data.start_date },
  });
  return data;
}

export async function updateLedgerConfig(
  id: string,
  updates: Partial<LedgerConfigInsert>
): Promise<LedgerConfig> {
  if (updates.name && updates.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("ledger_config")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: id,
    eventType: "config.update",
    description: "Updated ledger settings",
    metadata: { changes: updates },
  });
  return data;
}

export async function deleteLedgerConfig(id: string): Promise<void> {
  logAuditEvent({
    ledgerId: id,
    eventType: "config.delete",
    description: "Deleted ledger",
    metadata: {},
  });
  const { error } = await supabase
    .from("ledger_config")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
