import type { Tone } from "@/components/ui/tone";

/** Collected vs invoiced, in dollars; the board plots them in thousands. */
export const revenueTrend = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["30k", "20k", "10k", "0"],
  max: 30000,
  collected: [16800, 17600, 18800, 20000, 20600, 22200, 22400, 17000],
  invoiced: [17400, 18200, 19400, 20800, 21600, 23000, 23400, 24800],
};

export const revenueByStream = [
  { name: "Table eggs", value: 11420, color: "#7C3AED", display: "$11,420" },
  { name: "Live birds", value: 7936, color: "#A78BFA", display: "$7,936" },
  {
    name: "Processed chicken",
    value: 3648,
    color: "#C4B5FD",
    display: "$3,648",
  },
  { name: "By-products", value: 1176, color: "#DDD6FE", display: "$1,176" },
  { name: "Other", value: 640, color: "#E4E4E7", display: "$640" },
];

export type RevenueEntry = {
  date: string;
  reference: string;
  description: string;
  customer: string;
  amount: string;
  amountTone: Tone;
  method: string;
  status: string;
  statusTone: Tone;
};

export const revenueEntries: RevenueEntry[] = [
  {
    date: "09 Aug 2026",
    reference: "#ORD-2841",
    description: "Eggs, live birds & manure",
    customer: "Mama Ngozi Foods",
    amount: "$486",
    amountTone: "success",
    method: "Bank transfer",
    status: "Received",
    statusTone: "success",
  },
  {
    date: "09 Aug 2026",
    reference: "#ORD-2840",
    description: "Table eggs · 100 crates",
    customer: "Sunrise Supermarket",
    amount: "$310",
    amountTone: "success",
    method: "Bank transfer",
    status: "Received",
    statusTone: "success",
  },
  {
    date: "08 Aug 2026",
    reference: "#ORD-2839",
    description: "Processed chicken · 60 kg",
    customer: "Chop Life Restaurant",
    amount: "$742",
    amountTone: "warning",
    method: "Part cash",
    status: "Partial",
    statusTone: "warning",
  },
  {
    date: "08 Aug 2026",
    reference: "#ORD-2838",
    description: "Live birds · 190 birds",
    customer: "Kola Poultry Traders",
    amount: "$1,240",
    amountTone: "error",
    method: "Credit 30d",
    status: "Overdue",
    statusTone: "error",
  },
  {
    date: "06 Aug 2026",
    reference: "REV-0114",
    description: "Manure sale · 120 bags",
    customer: "Green Fields Farm",
    amount: "$336",
    amountTone: "success",
    method: "Cash",
    status: "Received",
    statusTone: "success",
  },
  {
    date: "04 Aug 2026",
    reference: "REV-0113",
    description: "Spent layers · 140 birds",
    customer: "Kola Poultry Traders",
    amount: "$588",
    amountTone: "success",
    method: "Cash",
    status: "Received",
    statusTone: "success",
  },
];
