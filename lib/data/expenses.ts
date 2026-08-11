import type { Tone } from "@/components/ui/tone";

/** Monthly spend per category in dollars; the board plots them in thousands. */
export const expenseTrend = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["20k", "13k", "7k", "0"],
  max: 20000,
  feed: [5100, 5450, 5750, 5850, 6150, 6251],
  labour: [2660, 2800, 2950, 3050, 3050, 3060],
  other: [5450, 5850, 6250, 6250, 6650, 7139],
};

export type LargestExpense = {
  name: string;
  source: string;
  amount: string;
  /** Bar length relative to the largest line, 0–100. */
  share: number;
};

export const largestExpenses: LargestExpense[] = [
  {
    name: "Broiler finisher feed",
    source: "Amo Feeds Ltd",
    amount: "$3,240",
    share: 100,
  },
  {
    name: "Layer mash",
    source: "Hybrid Nutrition",
    amount: "$2,110",
    share: 65,
  },
  {
    name: "Monthly payroll",
    source: "12 employees",
    amount: "$1,980",
    share: 61,
  },
  {
    name: "Diesel & electricity",
    source: "Ogun Power",
    amount: "$1,145",
    share: 35,
  },
  {
    name: "Vaccines & medicine",
    source: "VetPro Nigeria",
    amount: "$820",
    share: 25,
  },
];

export type Expense = {
  date: string;
  recordedBy: string;
  description: string;
  category: string;
  amount: string;
  supplier: string;
  payment: string;
  status: string;
  statusTone: Tone;
};

export const expenses: Expense[] = [
  {
    date: "09 Aug 2026",
    recordedBy: "Recorded by Samuel A.",
    description: "Broiler finisher feed · 5 tons",
    category: "Feed",
    amount: "$3,240",
    supplier: "Amo Feeds Ltd",
    payment: "Bank transfer",
    status: "Approved",
    statusTone: "success",
  },
  {
    date: "08 Aug 2026",
    recordedBy: "Recorded by Grace A.",
    description: "Layer mash · 3.6 tons",
    category: "Feed",
    amount: "$2,110",
    supplier: "Hybrid Nutrition",
    payment: "Bank transfer",
    status: "Approved",
    statusTone: "success",
  },
  {
    date: "05 Aug 2026",
    recordedBy: "Recorded by Samuel A.",
    description: "Monthly payroll · 12 staff",
    category: "Labour",
    amount: "$1,980",
    supplier: "—",
    payment: "Bank transfer",
    status: "Approved",
    statusTone: "success",
  },
  {
    date: "04 Aug 2026",
    recordedBy: "Recorded by Tunde B.",
    description: "Diesel for generators",
    category: "Utilities",
    amount: "$680",
    supplier: "Ogun Power",
    payment: "Cash",
    status: "Pending",
    statusTone: "warning",
  },
  {
    date: "03 Aug 2026",
    recordedBy: "Recorded by Dr. Chike",
    description: "Newcastle vaccine · 20 vials",
    category: "Medicine",
    amount: "$290",
    supplier: "VetPro Nigeria",
    payment: "Card",
    status: "Approved",
    statusTone: "success",
  },
  {
    date: "02 Aug 2026",
    recordedBy: "Recorded by Amina O.",
    description: "Delivery van maintenance",
    category: "Transport",
    amount: "$420",
    supplier: "AutoFix Ogun",
    payment: "Cash",
    status: "Pending",
    statusTone: "warning",
  },
];
