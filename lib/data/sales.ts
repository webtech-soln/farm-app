import type { Tone } from "@/components/ui/tone";

export const salesTrend = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["30k", "20k", "10k", "0"],
  max: 30000,
  revenue: [17400, 18200, 19400, 20800, 21600, 23000, 23400, 24820],
  target: [18000, 18000, 19000, 20000, 21000, 22000, 23000, 24000],
};

export const salesByProduct = [
  { name: "Table Eggs", value: 11420, color: "#7C3AED", display: "$11,420" },
  { name: "Live Birds", value: 7936, color: "#A78BFA", display: "$7,936" },
  {
    name: "Processed Chicken",
    value: 3648,
    color: "#C4B5FD",
    display: "$3,648",
  },
  { name: "Other", value: 1816, color: "#DDD6FE", display: "$1,816" },
];

export type RecentOrder = {
  reference: string;
  summary: string;
  customer: string;
  total: string;
  payment: string;
  paymentTone: Tone;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export const recentOrders: RecentOrder[] = [
  {
    reference: "#ORD-2841",
    summary: "09 Aug · 3 items",
    customer: "Mama Ngozi Foods",
    total: "$486",
    payment: "Paid",
    paymentTone: "success",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2840",
    summary: "09 Aug · 1 item",
    customer: "Sunrise Supermarket",
    total: "$310",
    payment: "Paid",
    paymentTone: "success",
    status: "In transit",
    statusTone: "info",
  },
  {
    reference: "#ORD-2839",
    summary: "08 Aug · 5 items",
    customer: "Chop Life Restaurant",
    total: "$742",
    payment: "Partial",
    paymentTone: "warning",
    status: "Preparing",
    statusTone: "warning",
  },
  {
    reference: "#ORD-2838",
    summary: "08 Aug · 2 items",
    customer: "Kola Poultry Traders",
    total: "$1,240",
    payment: "Unpaid",
    paymentTone: "error",
    status: "Pending",
    statusTone: "neutral",
    statusDot: false,
  },
  {
    reference: "#ORD-2837",
    summary: "07 Aug · 4 items",
    customer: "Blessed Mart",
    total: "$528",
    payment: "Paid",
    paymentTone: "success",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2836",
    summary: "07 Aug · 1 item",
    customer: "Grace Adeyemi",
    total: "$96",
    payment: "Paid",
    paymentTone: "success",
    status: "Delivered",
    statusTone: "success",
  },
];

export type TopCustomer = {
  initials: string;
  name: string;
  revenue: string;
  /** Bar length relative to the strongest customer, 0–100. */
  share: number;
};

export const topCustomers: TopCustomer[] = [
  {
    initials: "MN",
    name: "Mama Ngozi Foods",
    revenue: "$4,280",
    share: 100,
  },
  {
    initials: "SS",
    name: "Sunrise Supermarket",
    revenue: "$3,140",
    share: 73,
  },
  {
    initials: "CL",
    name: "Chop Life Restaurant",
    revenue: "$2,410",
    share: 56,
  },
  {
    initials: "KP",
    name: "Kola Poultry Traders",
    revenue: "$1,880",
    share: 44,
  },
  { initials: "BM", name: "Blessed Mart", revenue: "$1,260", share: 29 },
];
