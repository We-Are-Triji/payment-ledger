import { useState, useEffect, useCallback } from "react";
import {
  getUserPreferences,
  upsertUserPreferences,
} from "@/api/user-preferences";
import type { UserPreferences } from "@/types";

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserPreferences();
      setPreferences(data);
    } catch {
      // Preferences not critical — fail silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const update = useCallback(
    async (
      prefs: Partial<Omit<UserPreferences, "user_id" | "updated_at">>
    ): Promise<void> => {
      await upsertUserPreferences(prefs);
      setPreferences((prev) => (prev ? { ...prev, ...prefs } : prev));
    },
    []
  );

  return { preferences, loading, update, refetch: fetchPreferences };
}
