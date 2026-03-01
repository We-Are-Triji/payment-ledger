import { supabase } from "@/lib/supabase";
import type { UserPreferences } from "@/types";

export async function getUserPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertUserPreferences(
  prefs: Partial<Omit<UserPreferences, "user_id" | "updated_at">>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: user.id, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw error;
}
