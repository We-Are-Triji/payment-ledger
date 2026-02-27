import { supabase } from "@/lib/supabase";
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
    .upsert(override, { onConflict: "override_date" })
    .select()
    .single();
  if (error) throw error;
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
}
