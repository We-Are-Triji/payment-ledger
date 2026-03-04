import { supabase } from "@/lib/supabase";
import { getValidatedExtension } from "@/lib/sanitize";

export async function uploadStudentAvatar(
  studentId: string,
  file: File
): Promise<string> {
  const ext = getValidatedExtension(file);
  const fileName = `${studentId}.${ext}`;
  const { error } = await supabase.storage
    .from("student-avatars")
    .upload(fileName, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage
    .from("student-avatars")
    .getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteStudentAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from("student-avatars")
    .remove([path]);
  if (error) throw error;
}
