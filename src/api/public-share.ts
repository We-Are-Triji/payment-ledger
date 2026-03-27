import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import type {
  LedgerPublicShare,
  PublicBalanceAccessMode,
  PublicBalanceSnapshot,
} from "@/types";

function normalizeEmails(emails: string[]): string[] {
  return [...new Set(
    emails
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )];
}

export async function getLedgerPublicShare(
  ledgerId: string
): Promise<LedgerPublicShare | null> {
  const { data, error } = await supabase
    .from("ledger_public_shares")
    .select("*")
    .eq("ledger_id", ledgerId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createLedgerPublicShare(
  ledgerId: string
): Promise<LedgerPublicShare> {
  const existing = await getLedgerPublicShare(ledgerId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("ledger_public_shares")
    .insert({
      ledger_id: ledgerId,
      access_mode: "private",
      allowed_emails: [],
    })
    .select()
    .single();
  if (error) throw error;

  logAuditEvent({
    ledgerId,
    eventType: "config.update",
    description: "Created public balance link",
    metadata: { shareId: data.id },
  });

  return data;
}

export async function updateLedgerPublicShare(
  shareId: string,
  ledgerId: string,
  updates: {
    access_mode: PublicBalanceAccessMode;
    allowed_emails: string[];
  }
): Promise<LedgerPublicShare> {
  const payload = {
    access_mode: updates.access_mode,
    allowed_emails: normalizeEmails(updates.allowed_emails),
  };

  const { data, error } = await supabase
    .from("ledger_public_shares")
    .update(payload)
    .eq("id", shareId)
    .eq("ledger_id", ledgerId)
    .select()
    .single();
  if (error) throw error;

  logAuditEvent({
    ledgerId,
    eventType: "config.update",
    description: "Updated public balance access",
    metadata: {
      shareId,
      accessMode: payload.access_mode,
      allowedEmails: payload.allowed_emails,
    },
  });

  return data;
}

export async function getPublicBalanceSnapshot(
  token: string
): Promise<PublicBalanceSnapshot> {
  const { data, error } = await supabase.rpc("get_public_balance_view", {
    p_token: token,
  });
  if (error) throw error;

  const rows = data as PublicBalanceSnapshot[] | null;
  if (!rows?.[0]) {
    throw new Error("Public balance link not found");
  }

  const snapshot = rows[0];
  return {
    ...snapshot,
    deposit_amount: Number(snapshot.deposit_amount || 0),
    payment_goal: Number(snapshot.payment_goal || 0),
    students: snapshot.students ?? [],
    payment_totals: snapshot.payment_totals ?? {},
    overrides: snapshot.overrides ?? [],
  };
}
