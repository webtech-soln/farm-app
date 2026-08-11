import type { Tone } from "@/components/ui/tone";

export type Flock = {
  id: string;
  started: string;
  type: string;
  breed: string;
  house: string;
  initial: string;
  current: string;
  age: string;
  mortality: string;
  /** Colour the board applies to the mortality figure. */
  mortalityTone: Tone | "ink";
  weight: string;
  status: string;
  statusTone: Tone;
};

export const flocks: Flock[] = [
  {
    id: "JF-2026-001",
    started: "Started 08 Jul 2026",
    type: "Broiler",
    breed: "Cobb 500",
    house: "House 01",
    initial: "4,900",
    current: "4,820",
    age: "32 days",
    mortality: "1.2%",
    mortalityTone: "success",
    weight: "1.45 kg",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-002",
    started: "Started 11 Jul 2026",
    type: "Broiler",
    breed: "Ross 308",
    house: "House 02",
    initial: "5,000",
    current: "4,950",
    age: "29 days",
    mortality: "1.8%",
    mortalityTone: "ink",
    weight: "1.31 kg",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-003",
    started: "Started 15 Mar 2026",
    type: "Layer",
    breed: "Isa Brown",
    house: "House 03",
    initial: "4,700",
    current: "4,600",
    age: "21 weeks",
    mortality: "2.1%",
    mortalityTone: "warning",
    weight: "—",
    status: "Warning",
    statusTone: "warning",
  },
  {
    id: "JF-2026-004",
    started: "Started 02 Jan 2026",
    type: "Layer",
    breed: "Lohmann",
    house: "House 04",
    initial: "4,240",
    current: "4,180",
    age: "34 weeks",
    mortality: "1.4%",
    mortalityTone: "success",
    weight: "—",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-005",
    started: "Started 29 Jul 2026",
    type: "Broiler",
    breed: "Cobb 500",
    house: "House 05",
    initial: "3,320",
    current: "3,300",
    age: "11 days",
    mortality: "0.6%",
    mortalityTone: "success",
    weight: "0.42 kg",
    status: "Brooding",
    statusTone: "info",
  },
  {
    id: "JF-2026-006",
    started: "Started 19 Jul 2026",
    type: "Broiler",
    breed: "Ross 308",
    house: "House 06",
    initial: "3,050",
    current: "3,000",
    age: "21 days",
    mortality: "1.6%",
    mortalityTone: "ink",
    weight: "0.98 kg",
    status: "Healthy",
    statusTone: "success",
  },
  {
    id: "JF-2026-007",
    started: "Started 05 Feb 2026",
    type: "Layer",
    breed: "Isa Brown",
    house: "House 03",
    initial: "2,100",
    current: "2,040",
    age: "27 weeks",
    mortality: "2.9%",
    mortalityTone: "error",
    weight: "—",
    status: "Treatment",
    statusTone: "error",
  },
  {
    id: "JF-2025-014",
    started: "Closed 30 Jun 2026",
    type: "Broiler",
    breed: "Cobb 500",
    house: "House 02",
    initial: "4,800",
    current: "0",
    age: "—",
    mortality: "2.4%",
    mortalityTone: "neutral",
    weight: "2.31 kg",
    status: "Closed",
    statusTone: "neutral",
  },
];
