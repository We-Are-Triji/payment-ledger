import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type { LedgerMemberWithEmail } from "@/types";

export async function getLedgerMembers(
  ledgerId: string
): Promise<LedgerMemberWithEmail[]> {
  const { data, error } = await supabase.rpc(
    "get_ledger_members_with_email",
    { p_ledger_id: ledgerId }
  );
  if (error) throw error;
  return (data as LedgerMemberWithEmail[]) ?? [];
}

export async function addLedgerMember(
  ledgerId: string,
  userId: string,
  role: "owner" | "admin"
): Promise<void> {
  const { error } = await supabase
    .from("ledger_members")
    .insert({ ledger_id: ledgerId, user_id: userId, role });
  if (error) throw error;
}

export async function removeLedgerMember(
  memberId: string,
  ledgerId: string,
  email: string
): Promise<void> {
  const { error } = await supabase
    .from("ledger_members")
    .delete()
    .eq("id", memberId);
  if (error) throw error;
  logAuditEvent({
    ledgerId,
    eventType: "member.remove",
    description: `Removed admin ${email}`,
    metadata: { memberId, email },
  });
}
