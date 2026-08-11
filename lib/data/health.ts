import type { Tone } from "@/components/ui/tone";

export const healthEventsTrend = {
  labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"],
  ticks: ["12", "8", "4", "0"],
  max: 12,
  resolved: [4, 3, 5, 2, 6, 4, 3, 2],
  open: [0, 0, 0, 0, 0, 1, 1, 1],
};

export const casesByCondition = [
  { name: "Respiratory", value: 12, color: "#7C3AED", display: "12" },
  { name: "Coccidiosis", value: 9, color: "#A78BFA", display: "9" },
  { name: "Heat stress", value: 8, color: "#C4B5FD", display: "8" },
  { name: "Injury", value: 4, color: "#DDD6FE", display: "4" },
  { name: "Other", value: 2, color: "#E4E4E7", display: "2" },
];

export type HealthAlert = {
  icon: "alert" | "vet" | "vaccine";
  tone: Tone;
  title: string;
  location: string;
  description: string;
  action: string;
};

export const healthAlerts: HealthAlert[] = [
  {
    icon: "alert",
    tone: "error",
    title: "Suspected coccidiosis",
    location: "Flock JF-2026-003 · House 03",
    description: "9 birds lost in 24h. Vet review requested.",
    action: "Assign vet",
  },
  {
    icon: "vet",
    tone: "warning",
    title: "Respiratory infection",
    location: "Flock JF-2026-007 · House 03",
    description: "Day 3 of 5 on Tylosin. 11 birds under treatment.",
    action: "View plan",
  },
  {
    icon: "vaccine",
    tone: "info",
    title: "Vaccination due",
    location: "Flock JF-2026-002 · House 02",
    description: "Gumboro booster scheduled for tomorrow 08:00.",
    action: "Confirm",
  },
];

export type HealthEvent = {
  date: string;
  reportedBy: string;
  flock: string;
  house: string;
  condition: string;
  cases: string;
  treatment: string;
  status: string;
  statusTone: Tone;
};

export const healthEvents: HealthEvent[] = [
  {
    date: "09 Aug 2026",
    reportedBy: "Reported by Tunde B.",
    flock: "JF-2026-003",
    house: "House 03",
    condition: "Suspected coccidiosis",
    cases: "9",
    treatment: "Awaiting diagnosis",
    status: "Escalated",
    statusTone: "error",
  },
  {
    date: "07 Aug 2026",
    reportedBy: "Reported by Dr. Chike",
    flock: "JF-2026-007",
    house: "House 03",
    condition: "Respiratory infection",
    cases: "11",
    treatment: "Tylosin · day 3 of 5",
    status: "In treatment",
    statusTone: "warning",
  },
  {
    date: "05 Aug 2026",
    reportedBy: "Reported by Amina O.",
    flock: "JF-2026-001",
    house: "House 01",
    condition: "Heat stress",
    cases: "6",
    treatment: "Electrolytes + ventilation",
    status: "Resolved",
    statusTone: "success",
  },
  {
    date: "01 Aug 2026",
    reportedBy: "Reported by Grace A.",
    flock: "JF-2026-004",
    house: "House 04",
    condition: "Injury (pecking)",
    cases: "4",
    treatment: "Isolation + antiseptic",
    status: "Resolved",
    statusTone: "success",
  },
  {
    date: "28 Jul 2026",
    reportedBy: "Reported by Dr. Chike",
    flock: "JF-2026-006",
    house: "House 06",
    condition: "Coccidiosis",
    cases: "14",
    treatment: "Amprolium · completed",
    status: "Resolved",
    statusTone: "success",
  },
];
