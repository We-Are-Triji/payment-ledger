import { supabase } from "@/lib/supabase";
import type { BugReport } from "@/types";

export async function createBugReport(report: {
  description: string;
  screenshot_url: string | null;
  reported_by: string;
}): Promise<BugReport> {
  const { data, error } = await supabase
    .from("bug_reports")
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadScreenshot(file: File): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from("bug-screenshots")
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from("bug-screenshots")
    .getPublicUrl(fileName);
  return data.publicUrl;
}
