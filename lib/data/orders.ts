import type { Tone } from "@/components/ui/tone";

/** The status strip above the register; `All` is the default selection. */
export const orderStatusCounts: Record<string, number> = {
  All: 162,
  Pending: 12,
  Confirmed: 18,
  Preparing: 7,
  Ready: 5,
  Delivered: 114,
  Cancelled: 6,
};

export type Order = {
  reference: string;
  placedAt: string;
  customer: string;
  items: string;
  total: string;
  payment: string;
  paymentTone: Tone;
  paymentDot?: boolean;
  delivery: string;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export const orders: Order[] = [
  {
    reference: "#ORD-2841",
    placedAt: "09 Aug 2026 · 10:22",
    customer: "Mama Ngozi Foods",
    items: "3",
    total: "$486",
    payment: "Paid",
    paymentTone: "success",
    delivery: "Own fleet",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2840",
    placedAt: "09 Aug 2026 · 09:41",
    customer: "Sunrise Supermarket",
    items: "1",
    total: "$310",
    payment: "Paid",
    paymentTone: "success",
    delivery: "Own fleet",
    status: "In transit",
    statusTone: "info",
  },
  {
    reference: "#ORD-2839",
    placedAt: "08 Aug 2026 · 16:05",
    customer: "Chop Life Restaurant",
    items: "5",
    total: "$742",
    payment: "Partial",
    paymentTone: "warning",
    delivery: "Pickup",
    status: "Preparing",
    statusTone: "warning",
  },
  {
    reference: "#ORD-2838",
    placedAt: "08 Aug 2026 · 11:30",
    customer: "Kola Poultry Traders",
    items: "2",
    total: "$1,240",
    payment: "Unpaid",
    paymentTone: "error",
    delivery: "3rd party",
    status: "Pending",
    statusTone: "neutral",
    statusDot: false,
  },
  {
    reference: "#ORD-2837",
    placedAt: "07 Aug 2026 · 15:12",
    customer: "Blessed Mart",
    items: "4",
    total: "$528",
    payment: "Paid",
    paymentTone: "success",
    delivery: "Own fleet",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2836",
    placedAt: "07 Aug 2026 · 08:55",
    customer: "Grace Adeyemi",
    items: "1",
    total: "$96",
    payment: "Paid",
    paymentTone: "success",
    delivery: "Pickup",
    status: "Delivered",
    statusTone: "success",
  },
  {
    reference: "#ORD-2835",
    placedAt: "06 Aug 2026 · 14:20",
    customer: "Sunrise Supermarket",
    items: "2",
    total: "$620",
    payment: "Refunded",
    paymentTone: "neutral",
    paymentDot: false,
    delivery: "Own fleet",
    status: "Cancelled",
    statusTone: "error",
  },
];

/** The order opened in the side panel. */
export const orderDetail = {
  reference: "#ORD-2841",
  placed: "Placed 09 Aug 2026 · 10:22",
  customer: {
    initials: "MN",
    name: "Mama Ngozi Foods",
    meta: "Wholesaler · +234 802 114 9920",
  },
  lines: [
    { name: "Table Eggs", detail: "40 crates × $3.10", amount: "$124.00" },
    { name: "Live Birds", detail: "45 birds × $6.40", amount: "$288.00" },
    { name: "Manure (bagged)", detail: "26 bags × $2.80", amount: "$72.80" },
  ],
  totals: [
    { label: "Subtotal", value: "$484.80" },
    { label: "Delivery", value: "$1.20" },
    { label: "Total", value: "$486.00", strong: true },
  ],
};

export type OrderEvent = {
  icon: "delivered" | "transit" | "packed" | "payment" | "placed";
  title: string;
  time: string;
  description: string;
};

export const orderTimeline: OrderEvent[] = [
  {
    icon: "delivered",
    title: "Delivered",
    time: "14:05",
    description: "Received by Ngozi Eze. Signed proof of delivery uploaded.",
  },
  {
    icon: "transit",
    title: "In transit",
    time: "12:30",
    description: "Driver Musa Danjuma left the farm with 3 items.",
  },
  {
    icon: "packed",
    title: "Ready for dispatch",
    time: "11:40",
    description: "Order packed and quality-checked.",
  },
  {
    icon: "payment",
    title: "Payment received",
    time: "10:35",
    description: "$486.00 via bank transfer.",
  },
  {
    icon: "placed",
    title: "Order placed",
    time: "10:22",
    description: "Created by Samuel Adeyemi.",
  },
];
