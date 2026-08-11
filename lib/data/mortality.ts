import type { Tone } from "@/components/ui/tone";

export const mortalityTrend = {
  labels: [
    "27", "28", "29", "30", "31", "01", "02",
    "03", "04", "05", "06", "07", "08", "09",
  ],
  ticks: ["45", "30", "15", "0"],
  max: 45,
  values: [17, 20, 15, 23, 18, 21, 29, 36, 25, 22, 19, 24, 26, 21],
  /** Amber above the 15/day per-flock threshold. */
  colors: [
    "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED",
    "#F59E0B", "#F59E0B",
    "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED", "#7C3AED",
  ],
};

export const mortalityByCause = [
  { name: "Heat stress", value: 185, color: "#7C3AED", display: "185" },
  { name: "Disease", value: 117, color: "#A78BFA", display: "117" },
  { name: "Injury", value: 78, color: "#C4B5FD", display: "78" },
  { name: "Culling", value: 58, color: "#DDD6FE", display: "58" },
  { name: "Unknown", value: 48, color: "#E4E4E7", display: "48" },
];

export type MortalityRecord = {
  date: string;
  time: string;
  flock: string;
  house: string;
  deaths: string;
  /** The board reddens counts that breached the threshold. */
  deathsAlert?: boolean;
  cause: string;
  recordedBy: string;
  status: string;
  statusTone: Tone;
};

export const mortalityRecords: MortalityRecord[] = [
  {
    date: "09 Aug 2026",
    time: "08:12",
    flock: "JF-2026-001",
    house: "House 01",
    deaths: "7",
    cause: "Heat stress",
    recordedBy: "Amina Okoro",
    status: "Reviewed",
    statusTone: "success",
  },
  {
    date: "09 Aug 2026",
    time: "08:40",
    flock: "JF-2026-003",
    house: "House 03",
    deaths: "9",
    deathsAlert: true,
    cause: "Suspected coccidiosis",
    recordedBy: "Tunde Bello",
    status: "Escalated",
    statusTone: "error",
  },
  {
    date: "09 Aug 2026",
    time: "09:05",
    flock: "JF-2026-006",
    house: "House 06",
    deaths: "3",
    cause: "Injury",
    recordedBy: "Amina Okoro",
    status: "Reviewed",
    statusTone: "success",
  },
  {
    date: "08 Aug 2026",
    time: "17:20",
    flock: "JF-2026-007",
    house: "House 03",
    deaths: "11",
    deathsAlert: true,
    cause: "Respiratory infection",
    recordedBy: "Dr. Chike Eze",
    status: "Under treatment",
    statusTone: "warning",
  },
  {
    date: "08 Aug 2026",
    time: "08:15",
    flock: "JF-2026-002",
    house: "House 02",
    deaths: "5",
    cause: "Heat stress",
    recordedBy: "Grace Amadi",
    status: "Reviewed",
    statusTone: "success",
  },
  {
    date: "07 Aug 2026",
    time: "16:45",
    flock: "JF-2026-004",
    house: "House 04",
    deaths: "4",
    cause: "Culling (low producer)",
    recordedBy: "Grace Amadi",
    status: "Reviewed",
    statusTone: "success",
  },
];
