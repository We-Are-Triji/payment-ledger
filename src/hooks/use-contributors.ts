import { useState, useEffect, useCallback, useRef } from "react";
import {
  getContributors,
  createContributor,
  updateContributor,
  deleteContributor,
} from "@/api/contributors";
import type { Contributor, ContributorInsert } from "@/types";

export function useContributors(ledgerId: string | undefined) {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchContributors = useCallback(async () => {
    if (!ledgerId) return;
    try {
      if (!hasFetched.current) setLoading(true);
      const data = await getContributors(ledgerId);
      setContributors(data);
      hasFetched.current = true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch contributors"
      );
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetchContributors();
  }, [fetchContributors]);

  const add = useCallback(
    async (data: ContributorInsert): Promise<Contributor> => {
      const result = await createContributor(data);
      setContributors((prev) =>
        [...prev, result].sort((a, b) => a.name.localeCompare(b.name))
      );
      return result;
    },
    []
  );

  const edit = useCallback(
    async (
      id: string,
      updates: Partial<ContributorInsert>
    ): Promise<Contributor> => {
      const result = await updateContributor(id, updates);
      setContributors((prev) =>
        prev
          .map((c) => (c.id === id ? result : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      return result;
    },
    []
  );

  const remove = useCallback(
    async (id: string, context?: { ledgerId: string; name: string }) => {
      await deleteContributor(id, context);
      setContributors((prev) => prev.filter((c) => c.id !== id));
    },
    []
  );

  return {
    contributors,
    loading,
    error,
    refetch: fetchContributors,
    add,
    edit,
    remove,
  };
}
