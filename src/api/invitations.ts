import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type { LedgerInvitation } from "@/types";

export async function createInvitation(
  ledgerId: string
): Promise<LedgerInvitation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("ledger_invitations")
    .insert({
      ledger_id: ledgerId,
      email: null,
      invited_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;

  logAuditEvent({
    ledgerId,
    eventType: "member.invite",
    description: "Generated invite link",
    metadata: { token: data.token },
  });

  return data;
}

export async function getPendingInvitation(
  ledgerId: string
): Promise<LedgerInvitation | null> {
  const { data, error } = await supabase
    .from("ledger_invitations")
    .select("*")
    .eq("ledger_id", ledgerId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function invalidateInvitation(
  invitationId: string,
  ledgerId: string
): Promise<void> {
  const { error } = await supabase
    .from("ledger_invitations")
    .delete()
    .eq("id", invitationId);
  if (error) throw error;

  logAuditEvent({
    ledgerId,
    eventType: "member.invite",
    description: "Invalidated invite link",
    metadata: { invitationId },
  });
}

export async function getInvitationByToken(
  token: string
): Promise<(LedgerInvitation & { ledger_name: string }) | null> {
  const { data, error } = await supabase.rpc("get_invitation_details", {
    p_token: token,
  });
  if (error) throw error;
  const rows = data as (LedgerInvitation & { ledger_name: string })[] | null;
  return rows?.[0] ?? null;
}

export async function acceptInvitation(token: string): Promise<void> {
  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });
  if (error) throw error;
}
