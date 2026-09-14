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

export const CONTRIBUTOR_STATUS_CONFIG = {
  paid: {
    label: "Paid",
    color: "bg-[rgba(168,213,186,0.18)] text-[var(--soft-mint)]",
  },
  partial: {
    label: "Partial",
    color: "bg-[rgba(251,228,161,0.18)] text-[var(--soft-gold)]",
  },
  unpaid: {
    label: "Unpaid",
    color: "bg-[rgba(255,181,167,0.18)] text-[var(--soft-peach)]",
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
