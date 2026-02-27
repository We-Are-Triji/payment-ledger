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
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  partial: {
    label: "Partial",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  },
} as const;

export const CALENDAR_STATUS_CONFIG = {
  holiday: { label: "Holiday", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  no_class: { label: "No Class", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
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
