import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type { CalendarOverride, CalendarOverrideInsert } from "@/types";

export async function getCalendarOverrides(
  ledgerId: string
): Promise<CalendarOverride[]> {
  const { data, error } = await supabase
    .from("calendar_overrides")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("override_date");
  if (error) throw error;
  return data;
}

export async function upsertCalendarOverride(
  override: CalendarOverrideInsert
): Promise<CalendarOverride> {
  const { data, error } = await supabase
    .from("calendar_overrides")
    .upsert(override, { onConflict: "ledger_id,override_date" })
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.ledger_id,
    eventType: "calendar.upsert",
    description: `Set ${data.override_date} as ${data.status === "skip_day" ? "Skip Day" : "Holiday"}${data.label ? ` (${data.label})` : ""}`,
    metadata: { date: data.override_date, status: data.status, label: data.label },
  });
  return data;
}

export async function deleteCalendarOverride(
  date: string,
  ledgerId: string
): Promise<void> {
  const { error } = await supabase
    .from("calendar_overrides")
    .delete()
    .eq("override_date", date)
    .eq("ledger_id", ledgerId);
  if (error) throw error;
  logAuditEvent({
    ledgerId,
    eventType: "calendar.delete",
    description: `Removed calendar override for ${date}`,
    metadata: { date },
  });
}
