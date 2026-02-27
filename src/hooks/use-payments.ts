import { useState, useEffect, useCallback } from "react";
import {
  getPaymentsWithStudents,
  getPaymentsByDate,
  getPaymentTotalsByStudent,
  createPayment,
  deletePayment,
  getPayments,
} from "@/api/payments";
import type { Payment, PaymentInsert, PaymentWithStudent, TransactionFilter } from "@/types";

export function usePaymentsWithStudents(
  ledgerId: string | undefined,
  filter: TransactionFilter
) {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      const data = await getPaymentsWithStudents(ledgerId, filter);
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId, filter]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { payments, loading, refetch: fetch };
}

export function usePaymentsByDate(
  ledgerId: string | undefined,
  date: string | null
) {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!ledgerId || !date) return;
    try {
      setLoading(true);
      const data = await getPaymentsByDate(ledgerId, date);
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId, date]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { payments, loading, refetch: fetch };
}

export function usePaymentTotals(ledgerId: string | undefined) {
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      const data = await getPaymentTotalsByStudent(ledgerId);
      setTotals(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { totals, loading, refetch: fetch };
}

export function useAllPayments(ledgerId: string | undefined) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      const data = await getPayments(ledgerId);
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { payments, loading, refetch: fetch };
}

export function usePaymentActions() {
  const add = useCallback(async (data: PaymentInsert): Promise<Payment> => {
    return createPayment(data);
  }, []);

  const remove = useCallback(async (id: string) => {
    await deletePayment(id);
  }, []);

  return { add, remove };
}
