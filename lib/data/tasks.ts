import type { Tone } from "@/components/ui/tone";

export type TaskPriority = "High" | "Medium" | "Low";

export type Task = {
  title: string;
  detail: string;
  priority: TaskPriority;
  context: string;
  initials: string;
  assignee: string;
  due: string;
};

export type TaskColumn = {
  name: string;
  /** Colour of the dot beside the column title. */
  tone: Tone;
  count: string;
  /** Completed cards mute the title and show a check beside the timestamp. */
  done?: boolean;
  tasks: Task[];
};

export const priorityTone: Record<TaskPriority, Tone> = {
  High: "error",
  Medium: "warning",
  Low: "violet",
};

export const taskBoard: TaskColumn[] = [
  {
    name: "Pending",
    tone: "neutral",
    count: "5",
    tasks: [
      {
        title: "Order layer feed",
        detail: "Grower mash below minimum stock",
        priority: "High",
        context: "Inventory",
        initials: "SA",
        assignee: "Samuel A.",
        due: "Today 14:00",
      },
      {
        title: "Record flock weights",
        detail: "Sample 50 birds per broiler house",
        priority: "Low",
        context: "House 01",
        initials: "AO",
        assignee: "Amina O.",
        due: "Today 16:30",
      },
      {
        title: "Repair House 04 drinker line",
        detail: "Leak reported during morning round",
        priority: "Medium",
        context: "House 04",
        initials: "TB",
        assignee: "Tunde B.",
        due: "Tomorrow",
      },
      {
        title: "Chase Kola Poultry payment",
        detail: "$3,420 overdue by 18 days",
        priority: "High",
        context: "Sales",
        initials: "BO",
        assignee: "Blessing O.",
        due: "Tomorrow",
      },
      {
        title: "Restock egg trays",
        detail: "Below 1,000 units",
        priority: "Low",
        context: "Inventory",
        initials: "GA",
        assignee: "Grace A.",
        due: "12 Aug",
      },
    ],
  },
  {
    name: "In Progress",
    tone: "info",
    count: "3",
    tasks: [
      {
        title: "Vaccinate Flock JF-2026-002",
        detail: "Gumboro booster · 4,950 doses",
        priority: "High",
        context: "House 02",
        initials: "CE",
        assignee: "Dr. Chike",
        due: "Today 11:00",
      },
      {
        title: "Investigate House 03 mortality",
        detail: "9 deaths in 24h · awaiting diagnosis",
        priority: "High",
        context: "House 03",
        initials: "CE",
        assignee: "Dr. Chike",
        due: "Today",
      },
      {
        title: "Deliver order #ORD-2840",
        detail: "Ikeja, Lagos · 40 kg",
        priority: "Medium",
        context: "Logistics",
        initials: "MD",
        assignee: "Musa D.",
        due: "Today 16:00",
      },
    ],
  },
  {
    name: "Completed",
    tone: "success",
    count: "6",
    done: true,
    tasks: [
      {
        title: "Record morning egg production",
        detail: "18,420 eggs across 2 layer houses",
        priority: "Low",
        context: "House 03",
        initials: "AO",
        assignee: "Amina O.",
        due: "Today 07:12",
      },
      {
        title: "Inspect House 03 ventilation",
        detail: "Level raised to 3 after heat spike",
        priority: "High",
        context: "House 03",
        initials: "TB",
        assignee: "Tunde B.",
        due: "Today 09:30",
      },
      {
        title: "Submit daily records",
        detail: "All 6 houses submitted",
        priority: "Medium",
        context: "All houses",
        initials: "GA",
        assignee: "Grace A.",
        due: "Today 08:40",
      },
      {
        title: "Clean water lines",
        detail: "House 01 and House 02 flushed",
        priority: "Low",
        context: "House 01",
        initials: "TB",
        assignee: "Tunde B.",
        due: "Yesterday",
      },
      {
        title: "Receive feed delivery",
        detail: "5 tons broiler finisher booked in",
        priority: "Medium",
        context: "Inventory",
        initials: "AO",
        assignee: "Amina O.",
        due: "Yesterday",
      },
      {
        title: "Pay VetPro invoice",
        detail: "$290 settled by card",
        priority: "Low",
        context: "Finance",
        initials: "SA",
        assignee: "Samuel A.",
        due: "08 Aug",
      },
    ],
  },
];
