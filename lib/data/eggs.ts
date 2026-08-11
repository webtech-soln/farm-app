import type { Tone } from "@/components/ui/tone";

export const eggTrend = {
  labels: [
    "27", "28", "29", "30", "31", "01", "02",
    "03", "04", "05", "06", "07", "08", "09",
  ],
  ticks: ["20k", "13k", "7k", "0"],
  max: 20_000,
  collected: [
    16125, 16750, 16875, 16375, 17500, 17750, 17250, 17000, 17500, 17875,
    17625, 17875, 17500, 17250,
  ],
  sold: [
    15375, 16000, 15875, 16000, 16750, 17125, 16500, 16375, 16875, 17125,
    17000, 17250, 16750, 16500,
  ],
};

export const gradeDistribution = [
  { name: "Grade A", value: 13262, color: "#7C3AED", display: "13,262" },
  { name: "Grade B", value: 4052, color: "#C4B5FD", display: "4,052" },
  { name: "Rejected", value: 1106, color: "#E4E4E7", display: "1,106" },
];

export const sizeBreakdown = [
  { label: "Small", value: "1,842", note: "10% of intake" },
  { label: "Medium", value: "4,420", note: "24% of intake" },
  { label: "Large", value: "7,368", note: "40% of intake" },
  { label: "Extra Large", value: "3,684", note: "20% of intake" },
  {
    label: "Grade A",
    value: "13,262",
    note: "Premium price",
    chip: "72%",
    chipAccent: true,
  },
  { label: "Grade B", value: "4,052", note: "Standard price", chip: "22%" },
];

export type Collection = {
  time: string;
  session: string;
  house: string;
  flock: string;
  collected: string;
  broken: string;
  rate: string;
  rateTone: Tone | "ink";
  recordedBy: string;
  status: string;
  statusTone: Tone;
};

export const collections: Collection[] = [
  {
    time: "07:00",
    session: "Morning collection",
    house: "House 03",
    flock: "JF-2026-003",
    collected: "4,180",
    broken: "62",
    rate: "90.9%",
    rateTone: "success",
    recordedBy: "Amina Okoro",
    status: "Synced",
    statusTone: "success",
  },
  {
    time: "07:20",
    session: "Morning collection",
    house: "House 04",
    flock: "JF-2026-004",
    collected: "3,760",
    broken: "48",
    rate: "89.9%",
    rateTone: "success",
    recordedBy: "Grace Amadi",
    status: "Synced",
    statusTone: "success",
  },
  {
    time: "11:30",
    session: "Midday collection",
    house: "House 03",
    flock: "JF-2026-003",
    collected: "3,240",
    broken: "51",
    rate: "70.4%",
    rateTone: "ink",
    recordedBy: "Amina Okoro",
    status: "Synced",
    statusTone: "success",
  },
  {
    time: "11:45",
    session: "Midday collection",
    house: "House 04",
    flock: "JF-2026-004",
    collected: "2,980",
    broken: "33",
    rate: "71.3%",
    rateTone: "ink",
    recordedBy: "Grace Amadi",
    status: "Synced",
    statusTone: "success",
  },
  {
    time: "16:00",
    session: "Evening collection",
    house: "House 03",
    flock: "JF-2026-007",
    collected: "2,420",
    broken: "20",
    rate: "118.6%",
    rateTone: "warning",
    recordedBy: "Tunde Bello",
    status: "Needs review",
    statusTone: "warning",
  },
  {
    time: "16:15",
    session: "Evening collection",
    house: "House 04",
    flock: "JF-2026-004",
    collected: "1,840",
    broken: "0",
    rate: "44.0%",
    rateTone: "ink",
    recordedBy: "Grace Amadi",
    status: "Pending sync",
    statusTone: "info",
  },
];
