import { useState, useEffect, useCallback } from "react";
import { getLedgerMembers, removeLedgerMember } from "@/api/ledger-members";
import type { LedgerMemberWithEmail } from "@/types";

export function useLedgerMembers(ledgerId: string | undefined) {
  const [members, setMembers] = useState<LedgerMemberWithEmail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      const data = await getLedgerMembers(ledgerId);
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const remove = useCallback(
    async (
      memberId: string,
      meta: { ledgerId: string; email: string }
    ): Promise<void> => {
      await removeLedgerMember(memberId, meta.ledgerId, meta.email);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    },
    []
  );

  return { members, loading, refetch: fetchMembers, remove };
}
