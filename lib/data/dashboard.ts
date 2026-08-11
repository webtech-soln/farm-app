import {
  Banknote,
  Bird,
  Check,
  Egg,
  HeartPulse,
  Layers,
  PackageOpen,
  Receipt,
  Syringe,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import type { Tone } from "@/components/ui/tone";

export type Kpi = {
  label: string;
  icon: LucideIcon;
  iconTone?: Tone;
  value: string;
  delta: string;
  deltaIcon: LucideIcon;
  deltaTone: Tone;
  note: string;
};

export const dashboardKpis: Kpi[] = [
  {
    label: "Total Birds",
    icon: Bird,
    value: "24,850",
    delta: "+3.2%",
    deltaIcon: TrendingUp,
    deltaTone: "success",
    note: "from last month",
  },
  {
    label: "Active Flocks",
    icon: Layers,
    value: "8",
    delta: "4 houses",
    deltaIcon: Check,
    deltaTone: "neutral",
    note: "6 houses in use",
  },
  {
    label: "Mortality Rate",
    icon: HeartPulse,
    value: "1.8%",
    delta: "↓ 0.4%",
    deltaIcon: TrendingDown,
    deltaTone: "success",
    note: "from last week",
  },
  {
    label: "Eggs Today",
    icon: Egg,
    value: "18,420",
    delta: "+5.8%",
    deltaIcon: TrendingUp,
    deltaTone: "success",
    note: "vs yesterday",
  },
  {
    label: "Feed Stock",
    icon: Wheat,
    iconTone: "warning",
    value: "4.8 tons",
    delta: "Low stock",
    deltaIcon: TriangleAlert,
    deltaTone: "warning",
    note: "≈ 4 days left",
  },
  {
    label: "Revenue",
    icon: Banknote,
    value: "$24,820",
    delta: "+12.4%",
    deltaIcon: TrendingUp,
    deltaTone: "success",
    note: "this month",
  },
  {
    label: "Expenses",
    icon: Receipt,
    value: "$16,450",
    delta: "+4.2%",
    deltaIcon: TrendingUp,
    deltaTone: "error",
    note: "this month",
  },
  {
    label: "Net Profit",
    icon: Wallet,
    value: "$8,370",
    delta: "+18.7%",
    deltaIcon: TrendingUp,
    deltaTone: "success",
    note: "this month",
  },
];

export const productionChart = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ticks: ["20k", "15k", "10k", "5k", "0"],
  max: 20_000,
  produced: [17220, 17780, 18000, 17560, 18560, 18890, 18440],
  sold: [16440, 17110, 16890, 17000, 17780, 18220, 17560],
};

export const financeChart = {
  labels: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"],
  ticks: ["30k", "20k", "10k", "0"],
  max: 30_000,
  revenue: [19340, 20830, 21670, 22830, 23330, 24820],
  expenses: [13170, 14170, 14830, 15170, 15830, 16450],
  profit: [6170, 6660, 6840, 7660, 7500, 8370],
};

export type FlockRow = {
  id: string;
  breed: string;
  house: string;
  birds: string;
  age: string;
  mortality: string;
  weight: string;
  status: string;
  statusTone: Tone;
};

export const flockPerformance: FlockRow[] = [
  {
    id: "JF-2026-001",
    breed: "Cobb 500 · Broiler",
    house: "House 01",
    birds: "4,820",
    age: "32 days",
    mortality: "1.2%",
    weight: "1.45 kg",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-002",
    breed: "Ross 308 · Broiler",
    house: "House 02",
    birds: "4,950",
    age: "29 days",
    mortality: "1.8%",
    weight: "1.31 kg",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-003",
    breed: "Isa Brown · Layer",
    house: "House 03",
    birds: "4,600",
    age: "21 weeks",
    mortality: "2.1%",
    weight: "—",
    status: "Warning",
    statusTone: "warning",
  },
  {
    id: "JF-2026-004",
    breed: "Lohmann · Layer",
    house: "House 04",
    birds: "4,180",
    age: "34 weeks",
    mortality: "1.4%",
    weight: "—",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-005",
    breed: "Cobb 500 · Broiler",
    house: "House 05",
    birds: "3,300",
    age: "11 days",
    mortality: "0.6%",
    weight: "0.42 kg",
    status: "Brooding",
    statusTone: "info",
  },
];

export const houseOccupancy = [
  { house: "House 01", current: 4820, capacity: 5000, tone: "violet" as const },
  { house: "House 02", current: 4950, capacity: 5000, tone: "warning" as const },
  { house: "House 03", current: 4600, capacity: 5000, tone: "violet" as const },
  { house: "House 04", current: 4180, capacity: 4500, tone: "violet" as const },
  { house: "House 05", current: 3300, capacity: 3500, tone: "violet" as const },
  { house: "House 06", current: 3000, capacity: 3500, tone: "violet" as const },
];

export const attentionAlerts = [
  {
    icon: TriangleAlert,
    tone: "error" as Tone,
    title: "High Mortality",
    time: "12 min ago",
    description: "Flock JF-2026-003 mortality exceeded the 2% threshold.",
    action: "Investigate",
  },
  {
    icon: PackageOpen,
    tone: "warning" as Tone,
    title: "Low Feed Stock",
    time: "1 hr ago",
    description: "Layer feed reaches minimum stock level in ~4 days.",
    action: "Reorder",
  },
  {
    icon: Syringe,
    tone: "info" as Tone,
    title: "Vaccination Due",
    time: "3 hrs ago",
    description: "Flock JF-2026-002 Gumboro booster scheduled tomorrow.",
    action: "Schedule",
  },
];

export const todaysTasks = [
  {
    title: "Record morning egg production",
    meta: "Amina O. · 07:00",
    priority: "Low",
    tone: "neutral" as Tone,
    done: true,
  },
  {
    title: "Inspect House 03 ventilation",
    meta: "Tunde B. · 09:30",
    priority: "High",
    tone: "error" as Tone,
    done: true,
  },
  {
    title: "Vaccinate Flock JF-2026-002",
    meta: "Dr. Chike · 11:00",
    priority: "High",
    tone: "error" as Tone,
    done: false,
  },
  {
    title: "Order layer feed",
    meta: "Samuel A. · 14:00",
    priority: "Medium",
    tone: "warning" as Tone,
    done: false,
  },
  {
    title: "Record flock weights",
    meta: "Amina O. · 16:30",
    priority: "Low",
    tone: "neutral" as Tone,
    done: false,
  },
];
