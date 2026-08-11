import type { Tone } from "@/components/ui/tone";

/** Icon keys resolved to lucide components on the page. */
export type ProductIcon =
  | "package"
  | "egg"
  | "bird"
  | "sprout"
  | "layers"
  | "beef";

export type Product = {
  name: string;
  category: string;
  icon: ProductIcon;
  status: string;
  statusTone: Tone;
  price: string;
  unit: string;
  /** Availability line; tinted when the product has run out. */
  available: string;
  availableTone?: Tone;
  note: string;
};

export const products: Product[] = [
  {
    name: "Live Birds",
    category: "Poultry",
    icon: "package",
    status: "In stock",
    statusTone: "success",
    price: "$6.40",
    unit: "per bird",
    available: "2,480 available",
    note: "+14% demand",
  },
  {
    name: "Table Eggs",
    category: "Eggs",
    icon: "egg",
    status: "In stock",
    statusTone: "success",
    price: "$3.10",
    unit: "per crate",
    available: "612 crates",
    note: "+6% demand",
  },
  {
    name: "Day-old Chicks",
    category: "Poultry",
    icon: "bird",
    status: "Out of stock",
    statusTone: "error",
    price: "$1.20",
    unit: "per chick",
    available: "0 available",
    availableTone: "error",
    note: "Restock 18 Aug",
  },
  {
    name: "Manure (bagged)",
    category: "By-product",
    icon: "sprout",
    status: "In stock",
    statusTone: "success",
    price: "$2.80",
    unit: "per bag",
    available: "340 bags",
    note: "Steady",
  },
  {
    name: "Spent Layers",
    category: "Poultry",
    icon: "layers",
    status: "Low stock",
    statusTone: "warning",
    price: "$4.20",
    unit: "per bird",
    available: "180 birds",
    note: "Cull batch due",
  },
  {
    name: "Processed Chicken",
    category: "Processed",
    icon: "beef",
    status: "In stock",
    statusTone: "success",
    price: "$9.60",
    unit: "per kg",
    available: "420 kg",
    note: "+22% demand",
  },
];

export type ProductPerformance = {
  name: string;
  units: string;
  revenue: string;
  cost: string;
  margin: string;
  /** Tints the margin figure; omit for an untinted reading. */
  marginTone?: Tone;
  orders: string;
  trend: string;
  trendTone: Tone;
};

export const productPerformance: ProductPerformance[] = [
  {
    name: "Table Eggs",
    units: "18,940",
    revenue: "$11,420",
    cost: "$7,180",
    margin: "37.1%",
    marginTone: "success",
    orders: "84",
    trend: "Growing",
    trendTone: "success",
  },
  {
    name: "Live Birds",
    units: "1,240",
    revenue: "$7,936",
    cost: "$5,410",
    margin: "31.8%",
    marginTone: "success",
    orders: "36",
    trend: "Growing",
    trendTone: "success",
  },
  {
    name: "Processed Chicken",
    units: "380 kg",
    revenue: "$3,648",
    cost: "$2,640",
    margin: "27.6%",
    orders: "22",
    trend: "Steady",
    trendTone: "info",
  },
  {
    name: "Manure (bagged)",
    units: "420",
    revenue: "$1,176",
    cost: "$310",
    margin: "73.6%",
    marginTone: "success",
    orders: "14",
    trend: "Steady",
    trendTone: "info",
  },
  {
    name: "Spent Layers",
    units: "140",
    revenue: "$588",
    cost: "$402",
    margin: "31.6%",
    orders: "6",
    trend: "Declining",
    trendTone: "warning",
  },
  {
    name: "Day-old Chicks",
    units: "0",
    revenue: "$0",
    cost: "$0",
    margin: "—",
    marginTone: "neutral",
    orders: "0",
    trend: "Out of stock",
    trendTone: "error",
  },
];
