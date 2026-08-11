import type { Tone } from "@/components/ui/tone";

export const feedTrend = {
  labels: [
    "27", "28", "29", "30", "31", "01", "02",
    "03", "04", "05", "06", "07", "08", "09",
  ],
  ticks: ["4.0t", "2.7t", "1.3t", "0"],
  max: 4,
  broiler: [
    1.63, 1.68, 1.7, 1.65, 1.73, 1.78, 1.78, 1.75, 1.8, 1.83, 1.78, 1.85,
    1.85, 1.65,
  ],
  layer: [
    1.1, 1.1, 1.08, 1.13, 1.13, 1.13, 1.1, 1.15, 1.15, 1.13, 1.18, 1.18,
    1.15, 1.08,
  ],
};

export const stockByType = [
  { name: "Broiler finisher", value: 1.5, color: "#7C3AED", display: "1.5 t" },
  { name: "Broiler starter", value: 1.1, color: "#A78BFA", display: "1.1 t" },
  { name: "Layer mash", value: 1.3, color: "#C4B5FD", display: "1.3 t" },
  { name: "Grower", value: 0.9, color: "#DDD6FE", display: "0.9 t" },
];

export type FeedItem = {
  name: string;
  batch: string;
  type: string;
  quantity: string;
  /** The board tints quantities that sit at or under the minimum. */
  quantityTone?: Tone;
  unitCost: string;
  totalValue: string;
  minStock: string;
  status: string;
  statusTone: Tone;
};

export const feedInventory: FeedItem[] = [
  {
    name: "Broiler Finisher",
    batch: "Batch FB-1182 · Amo Feeds",
    type: "Broiler",
    quantity: "1,500 kg",
    unitCost: "$0.62",
    totalValue: "$930",
    minStock: "800 kg",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Broiler Starter",
    batch: "Batch FB-1104 · Amo Feeds",
    type: "Broiler",
    quantity: "1,100 kg",
    unitCost: "$0.68",
    totalValue: "$748",
    minStock: "800 kg",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Layer Mash",
    batch: "Batch LM-0921 · Hybrid Nutrition",
    type: "Layer",
    quantity: "1,300 kg",
    quantityTone: "warning",
    unitCost: "$0.58",
    totalValue: "$754",
    minStock: "1,200 kg",
    status: "Reorder soon",
    statusTone: "warning",
  },
  {
    name: "Grower Mash",
    batch: "Batch GM-0810 · Hybrid Nutrition",
    type: "Grower",
    quantity: "900 kg",
    quantityTone: "warning",
    unitCost: "$0.55",
    totalValue: "$495",
    minStock: "1,000 kg",
    status: "Below minimum",
    statusTone: "error",
  },
  {
    name: "Chick Crumbs",
    batch: "Batch CC-0455 · Amo Feeds",
    type: "Starter",
    quantity: "420 kg",
    unitCost: "$0.74",
    totalValue: "$311",
    minStock: "300 kg",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Oyster Shell Grit",
    batch: "Batch OS-0212 · Delta Minerals",
    type: "Supplement",
    quantity: "180 kg",
    unitCost: "$0.31",
    totalValue: "$56",
    minStock: "150 kg",
    status: "In stock",
    statusTone: "success",
  },
];
