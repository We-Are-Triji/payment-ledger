import { useState, useEffect, useCallback, useRef } from "react";
import {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "@/api/students";
import type { Student, StudentInsert } from "@/types";

export function useStudents(ledgerId: string | undefined) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchStudents = useCallback(async () => {
    if (!ledgerId) return;
    try {
      if (!hasFetched.current) setLoading(true);
      const data = await getStudents(ledgerId);
      setStudents(data);
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, [ledgerId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const add = useCallback(
    async (data: StudentInsert): Promise<Student> => {
      const result = await createStudent(data);
      setStudents((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)));
      return result;
    },
    []
  );

  const edit = useCallback(
    async (id: string, updates: Partial<StudentInsert>): Promise<Student> => {
      const result = await updateStudent(id, updates);
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? result : s)).sort((a, b) => a.name.localeCompare(b.name))
      );
      return result;
    },
    []
  );

  const remove = useCallback(async (id: string, context?: { ledgerId: string; name: string }) => {
    await deleteStudent(id, context);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { students, loading, error, refetch: fetchStudents, add, edit, remove };
}
