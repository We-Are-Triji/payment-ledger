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
}

export type PaymentInsert = Omit<Payment, "id" | "created_at">;

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
export type TransactionFilter = "today" | "week" | "month";
