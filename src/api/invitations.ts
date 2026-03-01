import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type { LedgerInvitation } from "@/types";

export async function createInvitation(
  ledgerId: string,
  email: string
): Promise<LedgerInvitation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("ledger_invitations")
    .insert({
      ledger_id: ledgerId,
      email,
      invited_by: user.id,
    })
    .select()
    .single();
  if (error) throw error;

  logAuditEvent({
    ledgerId,
    eventType: "member.invite",
    description: `Invited ${email} as admin`,
    metadata: { email, token: data.token },
  });

  return data;
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
