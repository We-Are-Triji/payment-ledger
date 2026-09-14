import { useRef, useCallback } from "react";
import { exportBalanceCard, renderBalanceCardStyles } from "@/lib/export-balance";
import type { ContributorWithBalance } from "@/types";

export function useBalanceCard(
  contributor: ContributorWithBalance | null,
  ledgerName: string,
  depositAmount: number,
  totalExpected: number
) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleExport = useCallback(async () => {
    if (!cardRef.current || !contributor) return;
    await exportBalanceCard(cardRef.current, contributor.name);
  }, [contributor]);

  const cardHtml = contributor
    ? renderBalanceCardStyles(contributor, ledgerName, depositAmount, totalExpected)
    : null;

  return { cardRef, handleExport, cardHtml };
}
