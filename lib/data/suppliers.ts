import type { Tone } from "@/components/ui/tone";

export const spendBySupplier = {
  labels: [
    "Amo Feeds",
    "Hybrid Nutrition",
    "Delta Minerals",
    "VetPro Nigeria",
    "Ogun Packaging",
    "AgriTech Ltd",
    "Others",
  ],
  ticks: ["8k", "5k", "3k", "0"],
  max: 8000,
  values: [6950, 4900, 1950, 1700, 1200, 850, 550],
};

export const paymentStatus = [
  { name: "Paid in full", value: 8, color: "#7C3AED", display: "8" },
  { name: "Partially paid", value: 3, color: "#C4B5FD", display: "3" },
  { name: "Overdue", value: 1, color: "#DC2626", display: "1" },
];

export type Supplier = {
  name: string;
  location: string;
  category: string;
  contact: string;
  products: string;
  purchases: string;
  outstanding: string;
  outstandingTone?: Tone;
  status: string;
  statusTone: Tone;
};

export const suppliers: Supplier[] = [
  {
    name: "Amo Feeds Ltd",
    location: "Abeokuta, Ogun",
    category: "Feed",
    contact: "+234 802 114 9920",
    products: "6",
    purchases: "$42,180",
    outstanding: "$1,860",
    outstandingTone: "warning",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Hybrid Nutrition",
    location: "Ibadan, Oyo",
    category: "Feed",
    contact: "+234 803 552 1187",
    products: "4",
    purchases: "$28,640",
    outstanding: "$0",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "VetPro Nigeria",
    location: "Lagos",
    category: "Medicine",
    contact: "+234 807 442 0031",
    products: "11",
    purchases: "$12,410",
    outstanding: "$980",
    outstandingTone: "warning",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Delta Minerals",
    location: "Warri, Delta",
    category: "Supplement",
    contact: "+234 806 771 2244",
    products: "3",
    purchases: "$8,220",
    outstanding: "$0",
    status: "Active",
    statusTone: "success",
  },
  {
    name: "Ogun Packaging Co.",
    location: "Sagamu, Ogun",
    category: "Packaging",
    contact: "+234 805 330 8891",
    products: "5",
    purchases: "$6,940",
    outstanding: "$1,480",
    outstandingTone: "error",
    status: "Overdue 12d",
    statusTone: "error",
  },
  {
    name: "AgriTech Equipment",
    location: "Lagos",
    category: "Equipment",
    contact: "+234 809 220 6612",
    products: "9",
    purchases: "$5,120",
    outstanding: "$0",
    status: "Inactive",
    statusTone: "neutral",
  },
];
