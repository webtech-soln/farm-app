import {
  ClipboardCheck,
  Scale,
  Syringe,
  Thermometer,
} from "lucide-react";

import type { TimelineEvent } from "@/components/ui/timeline";

export const temperatureDay = {
  labels: ["00", "02", "04", "06", "08", "10", "12", "14", "16", "18", "20", "22"],
  ticks: ["36°", "24°", "12°", "0°"],
  max: 36,
  values: [25, 24, 24, 26, 28, 30, 32, 33, 31, 29, 27, 26],
  /** Amber wherever the reading breaks the 24–30°C band. */
  colors: [
    "#7C3AED",
    "#7C3AED",
    "#7C3AED",
    "#7C3AED",
    "#7C3AED",
    "#7C3AED",
    "#F59E0B",
    "#F59E0B",
    "#F59E0B",
    "#7C3AED",
    "#7C3AED",
    "#7C3AED",
  ],
};

export const birdCountTrend = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6"],
  ticks: ["4.92k", "4.88k", "4.84k", "4.80k"],
  min: 4800,
  max: 4920,
  values: [4900, 4884, 4870, 4851, 4836, 4820],
};

export const feedConsumption = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  ticks: ["800", "533", "266", "0"],
  max: 800,
  actual: [555, 565, 575, 560, 580, 590, 580],
  standard: [570, 580, 585, 590, 595, 600, 605],
};

export const houseActivity: TimelineEvent[] = [
  {
    icon: ClipboardCheck,
    tone: "violet",
    title: "Daily record submitted",
    time: "08:12",
    description: "Eggs 0 · feed 620 kg · 6 mortalities logged by Amina O.",
  },
  {
    icon: Thermometer,
    tone: "warning",
    title: "Temperature excursion",
    time: "14:20",
    description: "Reading peaked at 33°C between 13:40 and 14:20.",
  },
  {
    icon: Scale,
    tone: "success",
    title: "Weight sampling",
    time: "Yesterday",
    description: "50-bird sample averaged 1.45 kg (+0.06 kg vs standard).",
  },
  {
    icon: Syringe,
    tone: "success",
    title: "Vaccination completed",
    time: "2 days ago",
    description: "Newcastle (Lasota) administered by Dr. Chike.",
  },
];
