import { useState, useEffect, useCallback } from "react";
import {
  getCalendarOverrides,
  upsertCalendarOverride,
  deleteCalendarOverride,
} from "@/api/calendar";
import type { CalendarOverride, CalendarOverrideInsert } from "@/types";

export function useCalendar(ledgerId: string | undefined) {
  const [overrides, setOverrides] = useState<CalendarOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!ledgerId) return;
    try {
      setLoading(true);
      const data = await getCalendarOverrides(ledgerId);
      setOverrides(data);
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const upsert = useCallback(
    async (override: CalendarOverrideInsert) => {
      const result = await upsertCalendarOverride(override);
      setOverrides((prev) => {
        const filtered = prev.filter(
          (o) => o.override_date !== result.override_date
        );
        return [...filtered, result].sort((a, b) =>
          a.override_date.localeCompare(b.override_date)
        );
      });
      return result;
    },
    []
  );

  const remove = useCallback(
    async (date: string) => {
      if (!ledgerId) return;
      await deleteCalendarOverride(date, ledgerId);
      setOverrides((prev) => prev.filter((o) => o.override_date !== date));
    },
    [ledgerId]
  );

  return { overrides, loading, refetch: fetch, upsert, remove };
}
