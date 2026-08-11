import type { Tone } from "@/components/ui/tone";

export const medicineUsage = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["1000", "667", "333", "0"],
  max: 1000,
  values: [620, 713, 680, 793, 840, 820],
};

export const stockByCategory = [
  { name: "Vaccines", value: 9, color: "#7C3AED", display: "9" },
  { name: "Antibiotics", value: 6, color: "#A78BFA", display: "6" },
  { name: "Vitamins", value: 5, color: "#C4B5FD", display: "5" },
  { name: "Disinfectants", value: 4, color: "#DDD6FE", display: "4" },
];

export type Medicine = {
  name: string;
  supplier: string;
  category: string;
  quantity: string;
  /** Tints the quantity when the batch is low or below minimum. */
  quantityTone?: Tone;
  unit: string;
  batch: string;
  expiry: string;
  expiryNote: string;
  unitCost: string;
  status: string;
  statusTone: Tone;
};

export const medicines: Medicine[] = [
  {
    name: "Newcastle Vaccine (Lasota)",
    supplier: "VetPro Nigeria",
    category: "Vaccine",
    quantity: "12",
    unit: "vials",
    batch: "NCD-2411",
    expiry: "28 Aug 2026",
    expiryNote: "19 days left",
    unitCost: "$14.50",
    status: "Expiring soon",
    statusTone: "warning",
  },
  {
    name: "Coccidiostat Premix",
    supplier: "VetPro Nigeria",
    category: "Antibiotic",
    quantity: "8",
    quantityTone: "error",
    unit: "kg",
    batch: "CCP-0288",
    expiry: "19 Aug 2026",
    expiryNote: "10 days left",
    unitCost: "$31.00",
    status: "Expiring · low",
    statusTone: "error",
  },
  {
    name: "Tylosin Soluble Powder",
    supplier: "VetPro Nigeria",
    category: "Antibiotic",
    quantity: "14",
    unit: "sachets",
    batch: "TYL-1180",
    expiry: "04 Mar 2027",
    expiryNote: "207 days left",
    unitCost: "$8.20",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Gumboro Vaccine",
    supplier: "Zoetis",
    category: "Vaccine",
    quantity: "6",
    quantityTone: "warning",
    unit: "vials",
    batch: "GMB-0921",
    expiry: "12 Dec 2026",
    expiryNote: "125 days left",
    unitCost: "$16.80",
    status: "Below minimum",
    statusTone: "error",
  },
  {
    name: "Multivitamin Electrolyte",
    supplier: "Delta Minerals",
    category: "Vitamin",
    quantity: "22",
    unit: "kg",
    batch: "MVE-0455",
    expiry: "30 Jun 2027",
    expiryNote: "325 days left",
    unitCost: "$5.40",
    status: "In stock",
    statusTone: "success",
  },
  {
    name: "Iodine Disinfectant",
    supplier: "AgriTech Ltd",
    category: "Disinfectant",
    quantity: "9",
    unit: "litres",
    batch: "IOD-0710",
    expiry: "18 Jan 2028",
    expiryNote: "527 days left",
    unitCost: "$6.10",
    status: "In stock",
    statusTone: "success",
  },
];
