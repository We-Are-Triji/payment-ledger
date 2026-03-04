import { supabase } from "@/lib/supabase";
import { logAuditEvent } from "@/lib/audit";
import { MAX_NAME_LENGTH, createThrottle } from "@/lib/sanitize";
import type { Student, StudentInsert } from "@/types";

const throttleStudent = createThrottle(1000);

export async function getStudents(ledgerId: string): Promise<Student[]> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("ledger_id", ledgerId)
    .order("name");
  if (error) throw error;
  return data;
}

export async function createStudent(student: StudentInsert): Promise<Student> {
  throttleStudent();
  if (student.name && student.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("students")
    .insert(student)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.ledger_id,
    eventType: "student.create",
    description: `Added member "${data.name}"`,
    metadata: { studentId: data.id, name: data.name, sex: data.sex },
  });
  return data;
}

export async function updateStudent(
  id: string,
  updates: Partial<StudentInsert>
): Promise<Student> {
  throttleStudent();
  if (updates.name && updates.name.length > MAX_NAME_LENGTH) {
    throw new Error("Name too long");
  }
  const { data, error } = await supabase
    .from("students")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  logAuditEvent({
    ledgerId: data.ledger_id,
    eventType: "student.update",
    description: `Updated member "${data.name}"`,
    metadata: { studentId: id, changes: updates },
  });
  return data;
}

export async function deleteStudent(
  id: string,
  context?: { ledgerId: string; name: string }
): Promise<void> {
  throttleStudent();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw error;
  if (context) {
    logAuditEvent({
      ledgerId: context.ledgerId,
      eventType: "student.delete",
      description: `Deleted member "${context.name}"`,
      metadata: { studentId: id },
    });
  }
}
