import { supabase } from "@/lib/supabase";
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
  return data;
}

export async function deleteLedgerConfig(id: string): Promise<void> {
  const { error } = await supabase
    .from("ledger_config")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
