import { supabase } from "@/lib/supabase";
import { getValidatedExtension, createThrottle } from "@/lib/sanitize";
import type { BugReport } from "@/types";

const throttleBugReport = createThrottle(10000);

export async function createBugReport(report: {
  description: string;
  screenshot_url: string | null;
  reported_by: string;
}): Promise<BugReport> {
  throttleBugReport();
  const { data, error } = await supabase
    .from("bug_reports")
    .insert(report)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadScreenshot(file: File): Promise<string> {
  const ext = getValidatedExtension(file);
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("bug-screenshots")
    .upload(fileName, file);
  if (error) throw error;

  const { data } = supabase.storage
    .from("bug-screenshots")
    .getPublicUrl(fileName);
  return data.publicUrl;
}
