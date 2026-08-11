import type { Tone } from "@/components/ui/tone";

/** Dollars per month; the board plots them in thousands. */
export const revenueVsExpenses = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["30k", "20k", "10k", "0"],
  max: 30000,
  revenue: [17400, 18200, 19300, 20800, 21600, 22900, 23400, 24820],
  expenses: [12550, 12900, 13100, 14050, 14800, 15200, 15900, 16450],
  profit: [4850, 5300, 6200, 6750, 6800, 7700, 7500, 8370],
};

export const monthlyProfit = {
  labels: revenueVsExpenses.labels,
  ticks: ["10k", "6.7k", "3.3k", "0"],
  max: 10000,
  values: revenueVsExpenses.profit,
};

export const expensesByCategory = [
  { name: "Feed", value: 6251, color: "#7C3AED", display: "$6,251" },
  { name: "Labour", value: 3126, color: "#A78BFA", display: "$3,126" },
  { name: "Medicine", value: 1810, color: "#C4B5FD", display: "$1,810" },
  { name: "Utilities", value: 1645, color: "#DDD6FE", display: "$1,645" },
  { name: "Transport", value: 1481, color: "#EDE9FE", display: "$1,481" },
  { name: "Other", value: 2137, color: "#E4E4E7", display: "$2,137" },
];

export type CashLine = {
  label: string;
  value: string;
  icon: "wallet" | "credit-card" | "file-minus" | "package";
  /** Tints the amount; omitted for neutral balances. */
  tone?: Tone;
};

export const cashPosition: CashLine[] = [
  { label: "Cash & bank", value: "$28,940", icon: "wallet" },
  {
    label: "Receivables",
    value: "$7,840",
    icon: "credit-card",
    tone: "warning",
  },
  { label: "Payables", value: "-$4,320", icon: "file-minus", tone: "error" },
  { label: "Inventory value", value: "$38,420", icon: "package" },
];

export const workingCapital = "$70,880";
