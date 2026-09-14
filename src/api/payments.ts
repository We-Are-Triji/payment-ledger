import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { formatCurrency } from "@/lib/utils";
import { createThrottle } from "@/lib/sanitize";
import type { Payment, PaymentInsert, PaymentWithContributor } from "@/types";

const throttlePayment = createThrottle(1000);

export async function getPayments(ledgerId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, contributor:contributors!inner(ledger_id)")
    .eq("contributor.ledger_id", ledgerId)
    .is("voided_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ contributor: _c, ...rest }) => rest);
}

export async function getPaymentsByDate(
  ledgerId: string,
  date: string
): Promise<PaymentWithContributor[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, contributor:contributors!inner(id, name, avatar_url, ledger_id)")
    .eq("contributor.ledger_id", ledgerId)
    .eq("payment_date", date)
    .is("voided_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(({ contributor, ...rest }) => ({
    ...rest,
    contributor: {
      id: contributor.id,
      name: contributor.name,
      avatar_url: contributor.avatar_url,
    },
  }));
}

export async function getPaymentTotalsByContributor(
  ledgerId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("payments")
    .select("contributor_id, amount, contributor:contributors!inner(ledger_id)")
    .eq("contributor.ledger_id", ledgerId)
    .is("voided_at", null);
  if (error) throw error;

  const totals: Record<string, number> = {};
  for (const row of data) {
    totals[row.contributor_id] =
      (totals[row.contributor_id] || 0) + Number(row.amount);
  }
  return totals;
}

export async function createPayment(
  payment: PaymentInsert,
  context?: { ledgerId: string; contributorName: string }
): Promise<Payment> {
  throttlePayment();
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "payment.create",
      description: `Added ${formatCurrency(data.amount)} payment for ${context.contributorName}`,
      metadata: { paymentId: data.id, contributorId: data.contributor_id, amount: data.amount, date: data.payment_date, method: data.method },
    });
  }
  return data;
}

export async function deletePayment(
  id: string,
  context?: { ledgerId: string; amount: number; contributorName: string }
): Promise<void> {
  throttlePayment();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "payment.delete",
      description: `Deleted ${formatCurrency(context.amount)} payment for ${context.contributorName}`,
      metadata: { paymentId: id, amount: context.amount },
    });
  }
}

export async function voidPayment(
  id: string,
  context?: { ledgerId: string; amount: number; contributorName: string }
): Promise<void> {
  throttlePayment();
  const { data, error } = await supabase
    .from("payments")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", id)
    .is("voided_at", null)
    .select()
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Payment was already voided");
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "payment.void",
      description: `Voided ${formatCurrency(context.amount)} payment for ${context.contributorName}`,
      metadata: { paymentId: id, amount: context.amount },
    });
  }
}

export async function getPaymentsByRange(
  ledgerId: string,
  from: string,
  to: string
): Promise<PaymentWithContributor[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, contributor:contributors!inner(id, name, avatar_url, ledger_id)")
    .eq("contributor.ledger_id", ledgerId)
    .gte("payment_date", from)
    .lte("payment_date", to)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(({ contributor, ...rest }) => ({
    ...rest,
    contributor: {
      id: contributor.id,
      name: contributor.name,
      avatar_url: contributor.avatar_url,
    },
  }));
}
