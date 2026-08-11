import type { Tone } from "@/components/ui/tone";

export const stockMovement = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  ticks: ["12k", "8k", "4k", "0"],
  max: 12_000,
  stockIn: [7725, 8550, 7125, 9750, 8250, 9000, 10500, 9225],
  stockOut: [6975, 7425, 7725, 7575, 8100, 8325, 8625, 8850],
};

export const valueByCategory = [
  { name: "Feed", value: 16136, color: "#7C3AED", display: "$16,136" },
  { name: "Medicine", value: 6916, color: "#A78BFA", display: "$6,916" },
  { name: "Equipment", value: 8068, color: "#C4B5FD", display: "$8,068" },
  { name: "Packaging", value: 4226, color: "#DDD6FE", display: "$4,226" },
  { name: "Other", value: 3074, color: "#E4E4E7", display: "$3,074" },
];

export type InventoryItem = {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  quantityTone?: Tone;
  unit: string;
  unitCost: string;
  expiration: string;
  status: string;
  statusTone: Tone;
};

export const inventoryItems: InventoryItem[] = [
  {
    name: "Broiler Finisher Feed",
    sku: "SKU FD-1182",
    category: "Feed",
    quantity: "1,500",
    unit: "kg",
    unitCost: "$0.62",
    expiration: "12 Oct 2026",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Newcastle Vaccine (Lasota)",
    sku: "SKU MD-0341",
    category: "Medicine",
    quantity: "12",
    unit: "vials",
    unitCost: "$14.50",
    expiration: "28 Aug 2026",
    status: "Expiring soon",
    statusTone: "warning",
  },
  {
    name: "Grower Mash",
    sku: "SKU FD-0810",
    category: "Feed",
    quantity: "900",
    quantityTone: "warning",
    unit: "kg",
    unitCost: "$0.55",
    expiration: "04 Nov 2026",
    status: "Below minimum",
    statusTone: "error",
  },
  {
    name: "Egg Trays (30-cell)",
    sku: "SKU PK-0022",
    category: "Packaging",
    quantity: "4,200",
    unit: "units",
    unitCost: "$0.09",
    expiration: "—",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Automatic Drinkers",
    sku: "SKU EQ-0114",
    category: "Equipment",
    quantity: "36",
    unit: "units",
    unitCost: "$22.00",
    expiration: "—",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Coccidiostat Premix",
    sku: "SKU MD-0288",
    category: "Medicine",
    quantity: "8",
    quantityTone: "error",
    unit: "kg",
    unitCost: "$31.00",
    expiration: "19 Aug 2026",
    status: "Expiring · low",
    statusTone: "error",
  },
  {
    name: "Wood Shavings (bale)",
    sku: "SKU CS-0507",
    category: "Consumable",
    quantity: "140",
    unit: "bales",
    unitCost: "$1.80",
    expiration: "—",
    status: "In stock",
    statusTone: "success",
  },
];
