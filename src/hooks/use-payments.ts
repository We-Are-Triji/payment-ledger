import { useState, useEffect, useCallback } from "react";
import {
  getPaymentsByRange,
  getPaymentsByDate,
  getPaymentTotalsByStudent,
  createPayment,
  deletePayment,
  voidPayment,
  getPayments,
} from "@/api/payments";
import type { Payment, PaymentInsert, PaymentWithStudent } from "@/types";

export function useTransactions(
  ledgerId: string | undefined,
  from: string,
  to: string
) {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!ledgerId || !from || !to) return;
    try {
      setLoading(true);
      const data = await getPaymentsByRange(ledgerId, from, to);
      setPayments(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId, from, to]);

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

  const voidTx = useCallback(async (id: string) => {
    await voidPayment(id);
  }, []);

  return { add, remove, voidTx };
}
