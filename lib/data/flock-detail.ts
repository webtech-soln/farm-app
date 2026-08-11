import {
  ClipboardCheck,
  PackagePlus,
  Scale,
  Syringe,
  Wheat,
} from "lucide-react";

import type { TimelineEvent } from "@/components/ui/timeline";

export const weightGrowth = {
  labels: ["D7", "D11", "D14", "D18", "D21", "D25", "D28", "D32"],
  ticks: ["2.0", "1.3", "0.7", "0"],
  max: 2,
  actual: [0.18, 0.43, 0.55, 0.78, 0.98, 1.14, 1.3, 1.45],
  standard: [0.18, 0.4, 0.53, 0.75, 0.95, 1.13, 1.28, 1.39],
};

export const birdPopulation = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
  ticks: ["4.92k", "4.88k", "4.84k", "4.80k"],
  min: 4800,
  max: 4920,
  values: [4900, 4884, 4870, 4851, 4836, 4820],
};

export const flockFeed = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
  ticks: ["800", "533", "266", "0"],
  max: 800,
  values: [160, 270, 375, 465, 530, 565, 580],
};

export const flockMortality = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
  ticks: ["30", "20", "10", "0"],
  max: 30,
  values: [21, 14, 11, 9, 8, 9, 8],
};

export const flockActivity: TimelineEvent[] = [
  {
    icon: Scale,
    tone: "success",
    title: "Weight sampling recorded",
    time: "Today · 08:40",
    description: "50-bird sample averaged 1.45 kg. Uniformity 88%.",
  },
  {
    icon: ClipboardCheck,
    tone: "violet",
    title: "Daily record submitted",
    time: "Today · 08:12",
    description: "620 kg feed, 7 mortalities, water 980 L.",
  },
  {
    icon: Wheat,
    tone: "info",
    title: "Feed batch changed",
    time: "2 days ago",
    description: "Switched from starter to finisher feed (batch FB-1182).",
  },
  {
    icon: Syringe,
    tone: "success",
    title: "Vaccination completed",
    time: "4 days ago",
    description:
      "Newcastle (Lasota) administered to full flock by Dr. Chike.",
  },
  {
    icon: PackagePlus,
    tone: "violet",
    title: "Flock placed",
    time: "08 Jul 2026",
    description: "4,900 day-old chicks received from Amo Hatchery.",
  },
];

export const flockFinancials = [
  { label: "Feed cost", value: "$6,240" },
  { label: "Day-old chicks", value: "$2,940" },
  { label: "Medication & vaccines", value: "$410" },
  { label: "Labour & utilities", value: "$780" },
  { label: "Total cost", value: "$10,370", strong: true },
  { label: "Projected revenue", value: "$15,890", strong: true, tone: "success" as const },
  { label: "Projected profit", value: "$5,520", strong: true, tone: "violet" as const },
];
