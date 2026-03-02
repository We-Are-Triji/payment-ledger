export const DAY_NAMES = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

export const STUDENT_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    color: "bg-emerald-50 text-emerald-700",
  },
  partial: {
    label: "Partial",
    color: "bg-amber-50 text-amber-700",
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-rose-50 text-rose-700",
  },
} as const;

export const DEFAULT_WEEK_FILTER: Record<number, boolean> = {
  0: false,
  1: true,
  2: true,
  3: true,
  4: true,
  5: true,
  6: false,
};
