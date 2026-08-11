import type { Tone } from "@/components/ui/tone";

/** Orders per month, split by whether the buyer was new or returning. */
export const customerMix = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["60", "40", "20", "0"],
  max: 60,
  returning: [28, 31, 34, 36, 39, 41, 44, 47],
  fresh: [6, 5, 8, 7, 9, 6, 8, 5],
};

export const revenueByType = [
  {
    name: "Wholesalers",
    value: 11417,
    color: "#7C3AED",
    display: "$11,417",
  },
  { name: "Retailers", value: 7198, color: "#A78BFA", display: "$7,198" },
  { name: "Restaurants", value: 4219, color: "#C4B5FD", display: "$4,219" },
  { name: "Walk-in", value: 1986, color: "#DDD6FE", display: "$1,986" },
];

export type Customer = {
  name: string;
  descriptor: string;
  type: string;
  orders: string;
  purchases: string;
  outstanding: string;
  /** Tints the balance; omitted when the account is settled. */
  outstandingTone?: Tone;
  lastPurchase: string;
  status: string;
  statusTone: Tone;
  /** Dormant accounts drop the badge dot on the board. */
  statusDot?: boolean;
};

export const customers: Customer[] = [
  {
    name: "Mama Ngozi Foods",
    descriptor: "Wholesaler · Abeokuta",
    type: "Wholesaler",
    orders: "38",
    purchases: "$14,280",
    outstanding: "$2,140",
    outstandingTone: "warning",
    lastPurchase: "09 Aug 2026",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Sunrise Supermarket",
    descriptor: "Retail chain · Lagos",
    type: "Retailer",
    orders: "27",
    purchases: "$9,640",
    outstanding: "$0",
    lastPurchase: "08 Aug 2026",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Chop Life Restaurant",
    descriptor: "Restaurant · Ibadan",
    type: "Restaurant",
    orders: "22",
    purchases: "$6,120",
    outstanding: "$980",
    outstandingTone: "warning",
    lastPurchase: "07 Aug 2026",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Kola Poultry Traders",
    descriptor: "Wholesaler · Sagamu",
    type: "Wholesaler",
    orders: "19",
    purchases: "$5,880",
    outstanding: "$3,420",
    outstandingTone: "error",
    lastPurchase: "22 Jul 2026",
    status: "Overdue 18d",
    statusTone: "error",
  },
  {
    name: "Blessed Mart",
    descriptor: "Retailer · Ogun",
    type: "Retailer",
    orders: "14",
    purchases: "$3,460",
    outstanding: "$1,300",
    outstandingTone: "warning",
    lastPurchase: "05 Aug 2026",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Grace Adeyemi",
    descriptor: "Walk-in · Ogun",
    type: "Walk-in",
    orders: "6",
    purchases: "$820",
    outstanding: "$0",
    lastPurchase: "12 Jun 2026",
    status: "Dormant",
    statusTone: "neutral",
    statusDot: false,
  },
];
