export interface LedgerConfig {
  id: string;
  name: string;
  deposit_amount: number;
  week_filter: Record<number, boolean>;
  payment_goal: number;
  start_date: string;
  admin_id: string;
  created_at: string;
  updated_at: string;
}

export type LedgerConfigInsert = Omit<
  LedgerConfig,
  "id" | "created_at" | "updated_at"
>;

export interface Student {
  id: string;
  ledger_id: string;
  name: string;
  sex: "male" | "female" | "other";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentInsert = Omit<Student, "id" | "created_at" | "updated_at">;

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
  recorded_by: string;
  voided_at: string | null;
  method: "quick" | "manual" | "migration";
}

export type PaymentInsert = Omit<Payment, "id" | "created_at" | "voided_at">;

export interface CalendarOverride {
  id: string;
  override_date: string;
  status: "holiday" | "no_class";
  label: string | null;
  ledger_id: string;
  created_at: string;
}

export type CalendarOverrideInsert = Omit<CalendarOverride, "id" | "created_at">;

export interface BugReport {
  id: string;
  description: string;
  screenshot_url: string | null;
  reported_by: string;
  created_at: string;
}

export interface StudentWithBalance extends Student {
  totalPaid: number;
  balance: number;
  status: "paid" | "partial" | "unpaid";
}

export interface PaymentWithStudent extends Payment {
  student: Pick<Student, "id" | "name" | "avatar_url">;
}

export interface GlobalSummary {
  totalCollected: number;
  globalExpected: number;
  collectionRate: number;
  goalProgress: number;
  remaining: number;
  paymentGoal: number;
}

export interface DaySummary {
  paid: Array<Pick<Student, "id" | "name" | "avatar_url">>;
  missed: Array<Pick<Student, "id" | "name" | "avatar_url">>;
  totalCollected: number;
  expectedForDay: number;
}

export type TabId = "dashboard" | "users" | "transactions" | "calendar";
export type TransactionPreset = "today" | "yesterday" | "month" | "custom";

export interface Backup {
  id: string;
  ledger_id: string;
  label: string;
  created_at: string;
}

export interface BackupData {
  version: number;
  created_at: string;
  ledger_config: LedgerConfig;
  students: Student[];
  payments: Payment[];
  calendar_overrides: CalendarOverride[];
  audit_logs?: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  ledger_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
}

export type AuditEventType =
  | "payment.create"
  | "payment.void"
  | "payment.delete"
  | "student.create"
  | "student.update"
  | "student.delete"
  | "config.create"
  | "config.update"
  | "config.delete"
  | "calendar.upsert"
  | "calendar.delete"
  | "backup.create"
  | "backup.delete"
  | "backup.restore"
  | "member.invite"
  | "member.accept"
  | "member.remove";

// Multi-ledger types

export interface LedgerMember {
  id: string;
  ledger_id: string;
  user_id: string;
  role: "owner" | "admin";
  created_at: string;
}

export interface LedgerMemberWithEmail extends LedgerMember {
  email: string;
}

export interface LedgerInvitation {
  id: string;
  ledger_id: string;
  email: string | null;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface LedgerWithRole {
  id: string;
  name: string;
  deposit_amount: number;
  payment_goal: number;
  start_date: string;
  admin_id: string;
  created_at: string;
  role: "owner" | "admin";
}

export interface UserPreferences {
  user_id: string;
  show_ledger_selector: boolean;
  last_ledger_id: string | null;
  updated_at: string;
}
