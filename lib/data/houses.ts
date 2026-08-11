import type { Tone } from "@/components/ui/tone";

export type House = {
  id: string;
  name: string;
  flock: string;
  status: string;
  statusTone: Tone;
  birds: number;
  capacity: number;
  /** Occupancy percentage as printed on the board. */
  occupancy: number;
  temp: number;
  tempOutOfBand?: boolean;
  humidity: number;
  feedToday: number;
  /** The board tints House 02's near-full rail amber. */
  railTone?: "violet" | "warning";
};

export const houses: House[] = [
  {
    id: "house-01",
    name: "House 01",
    flock: "JF-2026-001 · Cobb 500 · Broiler",
    status: "Healthy",
    statusTone: "success",
    birds: 4820,
    capacity: 5000,
    occupancy: 96,
    temp: 27,
    humidity: 68,
    feedToday: 620,
  },
  {
    id: "house-02",
    name: "House 02",
    flock: "JF-2026-002 · Ross 308 · Broiler",
    status: "Healthy",
    statusTone: "success",
    birds: 4950,
    capacity: 5000,
    occupancy: 99,
    temp: 28,
    humidity: 65,
    feedToday: 640,
    railTone: "warning",
  },
  {
    id: "house-03",
    name: "House 03",
    flock: "JF-2026-003 · Isa Brown · Layer",
    status: "Warning",
    statusTone: "warning",
    birds: 4600,
    capacity: 5000,
    occupancy: 92,
    temp: 31,
    tempOutOfBand: true,
    humidity: 74,
    feedToday: 510,
  },
  {
    id: "house-04",
    name: "House 04",
    flock: "JF-2026-004 · Lohmann · Layer",
    status: "Healthy",
    statusTone: "success",
    birds: 4180,
    capacity: 4500,
    occupancy: 93,
    temp: 26,
    humidity: 70,
    feedToday: 470,
  },
  {
    id: "house-05",
    name: "House 05",
    flock: "JF-2026-005 · Cobb 500 · Brooding",
    status: "Brooding",
    statusTone: "info",
    birds: 3300,
    capacity: 3500,
    occupancy: 94,
    temp: 33,
    tempOutOfBand: true,
    humidity: 61,
    feedToday: 180,
  },
  {
    id: "house-06",
    name: "House 06",
    flock: "JF-2026-006 · Ross 308 · Broiler",
    status: "Healthy",
    statusTone: "success",
    birds: 3000,
    capacity: 3500,
    occupancy: 86,
    temp: 27,
    humidity: 66,
    feedToday: 390,
  },
];

export const farmSummary = [
  { label: "Total Houses", value: "6", icon: "warehouse" as const },
  { label: "Total Capacity", value: "26,500", icon: "layout-grid" as const },
  { label: "Occupied", value: "24,850", icon: "bird" as const },
  { label: "Active Flocks", value: "8", icon: "layers" as const },
  { label: "Avg Mortality", value: "1.6%", icon: "heart-pulse" as const },
  {
    label: "Farm Health",
    value: "Good",
    icon: "shield-check" as const,
    accent: true,
  },
];

export const healthDistribution = [
  { name: "Healthy", value: 6, color: "#7C3AED", display: "6 · 75%" },
  { name: "Monitoring", value: 1, color: "#C4B5FD", display: "1 · 12.5%" },
  { name: "Under treatment", value: 1, color: "#F59E0B", display: "1 · 12.5%" },
];
