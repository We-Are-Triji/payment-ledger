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
  const { data, error } = await supabase
    .from("ledger_invitations")
    .select("*, ledger_config:ledger_id(name)")
    .eq("token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const ledgerConfig = data.ledger_config as unknown as { name: string } | null;
  return {
    ...data,
    ledger_config: undefined as never,
    ledger_name: ledgerConfig?.name ?? "Unknown Ledger",
  };
}

export async function acceptInvitation(token: string): Promise<void> {
  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token,
  });
  if (error) throw error;
}
