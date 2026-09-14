import { supabase } from "@/lib/supabase";
import { getValidatedExtension } from "@/lib/sanitize";

// NOTE: The storage bucket id "student-avatars" is intentionally kept
// as-is. Renaming a bucket would orphan already-uploaded files; the
// bucket name is an internal identifier and is not user-facing.
const AVATAR_BUCKET = "student-avatars";

export async function uploadContributorAvatar(
  contributorId: string,
  file: File
): Promise<string> {
  const ext = getValidatedExtension(file);
  const fileName = `${contributorId}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(fileName, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function deleteContributorAvatar(path: string): Promise<void> {
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) throw error;
}
