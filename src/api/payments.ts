import { supabase } from "@/lib/supabase";
import type { Payment, PaymentInsert, PaymentWithStudent } from "@/types";
import { format, startOfWeek, startOfMonth } from "date-fns";
import type { TransactionFilter } from "@/types";

export async function getPayments(
  ledgerId: string
): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(({ student: _s, ...rest }) => rest);
}

export async function getPaymentsWithStudents(
  ledgerId: string,
  filter: TransactionFilter
): Promise<PaymentWithStudent[]> {
  const today = new Date();
  let fromDate: string;

  switch (filter) {
    case "today":
      fromDate = format(today, "yyyy-MM-dd");
      break;
    case "week":
      fromDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
      break;
    case "month":
      fromDate = format(startOfMonth(today), "yyyy-MM-dd");
      break;
  }

  const toDate = format(today, "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(id, name, avatar_url, ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .gte("payment_date", fromDate)
    .lte("payment_date", toDate)
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

export async function getPaymentsByDate(
  ledgerId: string,
  date: string
): Promise<PaymentWithStudent[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*, student:students!inner(id, name, avatar_url, ledger_id)")
    .eq("student.ledger_id", ledgerId)
    .eq("payment_date", date)
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
    .eq("student.ledger_id", ledgerId);
  if (error) throw error;

  const totals: Record<string, number> = {};
  for (const row of data) {
    totals[row.student_id] = (totals[row.student_id] || 0) + Number(row.amount);
  }
  return totals;
}

export async function createPayment(
  payment: PaymentInsert
): Promise<Payment> {
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) throw error;
}
