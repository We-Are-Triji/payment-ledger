import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type { LedgerConfig, LedgerConfigInsert } from "@/types";

export async function getLedgerConfig(): Promise<LedgerConfig | null> {
  const { data, error } = await supabase
    .from("ledger_config")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createLedgerConfig(
  config: LedgerConfigInsert
): Promise<LedgerConfig> {
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
