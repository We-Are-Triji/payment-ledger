import { useRef, useCallback } from "react";
import { exportBalanceCard, renderBalanceCardStyles } from "@/lib/export-balance";
import type { StudentWithBalance } from "@/types";

export function useBalanceCard(
  student: StudentWithBalance | null,
  ledgerName: string,
  depositAmount: number,
  totalExpected: number
) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!cardRef.current || !student) return;
    await exportBalanceCard(cardRef.current, student.name);
  }, [student]);

  const cardHtml = student
    ? renderBalanceCardStyles(student, ledgerName, depositAmount, totalExpected)
    : null;

  return { cardRef, handleExport, cardHtml };
}
