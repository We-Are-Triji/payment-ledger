import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { formatCurrency } from "@/lib/utils";
import type { Payment, PaymentInsert, PaymentWithStudent } from "@/types";

export async function getPayments(
  ledgerId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .is("voided_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ student: _s, ...rest }) => rest);
}

export async function getPaymentsByDate(
  ledgerId: string,
  date: string
): Promise<PaymentWithStudent[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(id, name, avatar_url, ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .eq("payment_date", date)
    .is("voided_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(({ student, ...rest }) => ({
    ...rest,
    student: {
      id: student.id,
      name: student.name,
      avatar_url: student.avatar_url,
    },
  }));
}

export async function getPaymentTotalsByStudent(
  ledgerId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("payments")
    .select("student_id, amount, student:students!inner(ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .is("voided_at", null);
  if (error) throw error;

  const totals: Record<string, number> = {};
  for (const row of data) {
    totals[row.student_id] = (totals[row.student_id] || 0) + Number(row.amount);
  }
  return totals;
}

export async function createPayment(
  payment: PaymentInsert,
  ledgerId?: string
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  if (ledgerId) {
    logAuditEvent({
      ledgerId,
      eventType: "payment.create",
      description: `Added ${formatCurrency(data.amount)} payment`,
      metadata: { paymentId: data.id, studentId: data.student_id, amount: data.amount, date: data.payment_date, method: data.method },
    });
  }
  return data;
}

export async function deletePayment(
  id: string,
  context?: { ledgerId: string; amount: number; studentName: string }
): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "payment.delete",
      description: `Deleted ${formatCurrency(context.amount)} payment for ${context.studentName}`,
      metadata: { paymentId: id, amount: context.amount },
    });
  }
}

export async function voidPayment(
  id: string,
  context?: { ledgerId: string; amount: number; studentName: string }
): Promise<void> {
  const { error } = await supabase
    .from("payments")
    .update({ voided_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "payment.void",
      description: `Voided ${formatCurrency(context.amount)} payment for ${context.studentName}`,
      metadata: { paymentId: id, amount: context.amount },
    });
  }
}

export async function getPaymentsByRange(
  ledgerId: string,
  from: string,
  to: string
): Promise<PaymentWithStudent[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(id, name, avatar_url, ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .gte("payment_date", from)
    .lte("payment_date", to)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(({ student, ...rest }) => ({
    ...rest,
    student: {
      id: student.id,
      name: student.name,
      avatar_url: student.avatar_url,
    },
  }));
}
