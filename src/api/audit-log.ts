import { supabase } from "@/lib/supabase";
import type { AuditLogEntry } from "@/types";

const PAGE_SIZE = 50;

export async function getAuditLogs(
  ledgerId: string,
  options?: {
    cursor?: string;
    eventType?: string;
  }
): Promise<AuditLogEntry[]> {
  let query = supabase
    .from("audit_log")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (options?.cursor) {
    query = query.lt("created_at", options.cursor);
  }
  if (options?.eventType) {
    query = query.like("event_type", `${options.eventType}.%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function purgeOldAuditLogs(
  ledgerId: string,
  retentionDays: number = 90
): Promise<number> {
  const { data, error } = await supabase.rpc("purge_old_audit_logs", {
    p_ledger_id: ledgerId,
    p_retention_days: retentionDays,
  });
  if (error) throw error;
  return data as number;
}
