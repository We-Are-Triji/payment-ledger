import { supabase } from "@/lib/supabase";

export async function uploadStudentAvatar(
  studentId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop();
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
