import { useState, useEffect, useCallback, useRef } from "react";
import { getAuditLogs, purgeOldAuditLogs } from "@/api/audit-log";
import type { AuditLogEntry } from "@/types";

const PAGE_SIZE = 50;

export function useAuditLog(ledgerId: string | undefined) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [eventFilter, setEventFilter] = useState<string | undefined>();
  const purged = useRef(false);

  useEffect(() => {
    if (!ledgerId || purged.current) return;
    purged.current = true;
    purgeOldAuditLogs(ledgerId).catch(() => {});
  }, [ledgerId]);

  const fetchEntries = useCallback(
    async (cursor?: string) => {
      if (!ledgerId) return;
      setLoading(true);
      try {
        const data = await getAuditLogs(ledgerId, {
          cursor,
          eventType: eventFilter,
        });
        if (cursor) {
          setEntries((prev) => [...prev, ...data]);
        } else {
          setEntries(data);
        }
        setHasMore(data.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [ledgerId, eventFilter]
  );

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const loadMore = useCallback(() => {
    const last = entries[entries.length - 1];
    if (last) fetchEntries(last.created_at);
  }, [entries, fetchEntries]);

  return {
    entries,
    loading,
    hasMore,
    loadMore,
    eventFilter,
    setEventFilter,
    refetch: () => fetchEntries(),
  };
}
