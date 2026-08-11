import type { Tone } from "@/components/ui/tone";

export type ReportIcon =
  | "chart-column"
  | "bird"
  | "wheat"
  | "egg"
  | "heart-pulse"
  | "stethoscope"
  | "package"
  | "shopping-bag"
  | "banknote";

export type ReportCard = {
  name: string;
  icon: ReportIcon;
  description: string;
  lastGenerated: string;
};

export const reportCards: ReportCard[] = [
  {
    name: "Farm Performance",
    icon: "chart-column",
    description:
      "Whole-farm KPIs: birds, production, mortality and cost per bird.",
    lastGenerated: "Last generated Today 06:00",
  },
  {
    name: "Flock Performance",
    icon: "bird",
    description:
      "Per-flock growth, FCR, uniformity and mortality against standard.",
    lastGenerated: "Last generated Today 06:00",
  },
  {
    name: "Feed Consumption",
    icon: "wheat",
    description: "Intake per house and flock, cost per kg and stock movement.",
    lastGenerated: "Last generated Yesterday",
  },
  {
    name: "Egg Production",
    icon: "egg",
    description: "Hen-day rate, grade split, breakages and wastage.",
    lastGenerated: "Last generated Today 07:30",
  },
  {
    name: "Mortality Report",
    icon: "heart-pulse",
    description:
      "Deaths by flock, house, cause and week with threshold breaches.",
    lastGenerated: "Last generated Today 08:15",
  },
  {
    name: "Health & Vet",
    icon: "stethoscope",
    description:
      "Disease events, treatments, vaccination coverage and vet visits.",
    lastGenerated: "Last generated 06 Aug 2026",
  },
  {
    name: "Inventory Report",
    icon: "package",
    description: "Stock on hand, valuation, low stock and expiring items.",
    lastGenerated: "Last generated Yesterday",
  },
  {
    name: "Sales Report",
    icon: "shopping-bag",
    description:
      "Orders, revenue by product and customer, outstanding balances.",
    lastGenerated: "Last generated Today 06:00",
  },
  {
    name: "Financial Statement",
    icon: "banknote",
    description: "P&L, expenses by category, margin and cash position.",
    lastGenerated: "Last generated 01 Aug 2026",
  },
];

export const reportFormats = ["PDF", "Excel", "CSV"];

export type GeneratedReport = {
  name: string;
  origin: string;
  period: string;
  format: string;
  size: string;
  generatedBy: string;
  when: string;
  status: string;
  statusTone: Tone;
};

export const generatedReports: GeneratedReport[] = [
  {
    name: "Farm Performance",
    origin: "Scheduled · daily",
    period: "01–09 Aug 2026",
    format: "PDF",
    size: "1.2 MB",
    generatedBy: "System",
    when: "Today 06:00",
    status: "Ready",
    statusTone: "success",
  },
  {
    name: "Egg Production",
    origin: "Manual",
    period: "August 2026",
    format: "Excel",
    size: "384 KB",
    generatedBy: "Samuel Adeyemi",
    when: "Today 07:30",
    status: "Ready",
    statusTone: "success",
  },
  {
    name: "Mortality Report",
    origin: "Manual",
    period: "01–09 Aug 2026",
    format: "PDF",
    size: "620 KB",
    generatedBy: "Dr. Chike Eze",
    when: "Today 08:15",
    status: "Ready",
    statusTone: "success",
  },
  {
    name: "Financial Statement",
    origin: "Scheduled · monthly",
    period: "July 2026",
    format: "PDF",
    size: "2.4 MB",
    generatedBy: "System",
    when: "01 Aug 2026",
    status: "Ready",
    statusTone: "success",
  },
  {
    name: "Inventory Report",
    origin: "Manual",
    period: "As at 08 Aug 2026",
    format: "CSV",
    size: "96 KB",
    generatedBy: "Amina Okoro",
    when: "Yesterday",
    status: "Ready",
    statusTone: "success",
  },
];
