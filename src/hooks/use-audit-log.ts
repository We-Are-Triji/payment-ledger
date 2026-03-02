import { useState, useEffect, useCallback, useRef } from "react";
import { getAuditLogs, purgeOldAuditLogs } from "@/api/audit-log";
import type { AuditLogEntry } from "@/types";

const PAGE_SIZE = 50;

export function useAuditLog(ledgerId: string | undefined) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [eventFilter, setEventFilter] = useState<string | undefined>();
  const cursors = useRef<(string | undefined)[]>([undefined]);
  const purged = useRef(false);

  useEffect(() => {
    if (!ledgerId || purged.current) return;
    purged.current = true;
    purgeOldAuditLogs(ledgerId).catch(() => {});
  }, [ledgerId]);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      if (!ledgerId) return;
      setLoading(true);
      try {
        const cursor = cursors.current[pageIndex];
        const data = await getAuditLogs(ledgerId, {
          cursor,
          eventType: eventFilter,
        });
        setEntries(data);
        setHasMore(data.length === PAGE_SIZE);
        setPage(pageIndex);
        if (data.length > 0) {
          cursors.current[pageIndex + 1] = data[data.length - 1].created_at;
        }
      } finally {
        setLoading(false);
      }
    },
    [ledgerId, eventFilter]
  );

  useEffect(() => {
    cursors.current = [undefined];
    fetchPage(0);
  }, [fetchPage]);

  const nextPage = useCallback(() => {
    if (hasMore) fetchPage(page + 1);
  }, [hasMore, page, fetchPage]);

  const prevPage = useCallback(() => {
    if (page > 0) fetchPage(page - 1);
  }, [page, fetchPage]);

  const setEventFilterAndReset = useCallback((filter: string | undefined) => {
    setEventFilter(filter);
  }, []);

  return {
    entries,
    loading,
    hasMore,
    page,
    nextPage,
    prevPage,
    eventFilter,
    setEventFilter: setEventFilterAndReset,
    refetch: () => {
      cursors.current = [undefined];
      fetchPage(0);
    },
  };
}
