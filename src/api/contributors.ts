import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { MAX_NAME_LENGTH, createThrottle } from "@/lib/sanitize";
import type { Contributor, ContributorInsert } from "@/types";

const throttleContributor = createThrottle(1000);

export async function getContributors(
  ledgerId: string
): Promise<Contributor[]> {
  const { data, error } = await supabase
    .from("contributors")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createContributor(
  contributor: ContributorInsert
): Promise<Contributor> {
  throttleContributor();
  if (contributor.name && contributor.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("contributors")
    .insert(contributor)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.ledger_id,
    eventType: "contributor.create",
    description: `Added contributor "${data.name}"`,
    metadata: { contributorId: data.id, name: data.name },
  });
  return data;
}

export async function updateContributor(
  id: string,
  updates: Partial<ContributorInsert>
): Promise<Contributor> {
  throttleContributor();
  if (updates.name && updates.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("contributors")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.ledger_id,
    eventType: "contributor.update",
    description: `Updated contributor "${data.name}"`,
    metadata: { contributorId: id, changes: updates },
  });
  return data;
}

export async function deleteContributor(
  id: string,
  context?: { ledgerId: string; name: string }
): Promise<void> {
  throttleContributor();
  const { error } = await supabase.from("contributors").delete().eq("id", id);
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "contributor.delete",
      description: `Deleted contributor "${context.name}"`,
      metadata: { contributorId: id },
    });
  }
}
