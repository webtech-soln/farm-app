import type { Tone } from "@/components/ui/tone";

export const notificationCounts: Record<string, number> = {
  All: 12,
  Health: 3,
  Inventory: 2,
  Tasks: 3,
  Finance: 2,
  Sales: 1,
  System: 1,
};

export type NotificationIcon =
  | "alert"
  | "syringe"
  | "package-open"
  | "credit-card"
  | "task"
  | "calendar-x"
  | "receipt"
  | "check";

export type Notification = {
  icon: NotificationIcon;
  tone: Tone;
  title: string;
  category: string;
  time: string;
  description: string;
  link: string;
  action: string;
  unread?: boolean;
};

export const notifications: Notification[] = [
  {
    icon: "alert",
    tone: "error",
    title: "High mortality threshold breached",
    category: "Health",
    time: "12 min ago",
    description:
      "Flock JF-2026-003 in House 03 lost 9 birds in 24 hours, exceeding the 2% weekly threshold.",
    link: "Flock JF-2026-003",
    action: "Investigate",
    unread: true,
  },
  {
    icon: "syringe",
    tone: "error",
    title: "Vaccination overdue",
    category: "Health",
    time: "1 hr ago",
    description:
      "Fowl typhoid for Flock JF-2026-007 was scheduled for 05 Aug and has not been recorded.",
    link: "Flock JF-2026-007",
    action: "Schedule now",
    unread: true,
  },
  {
    icon: "package-open",
    tone: "warning",
    title: "Grower mash below minimum",
    category: "Inventory",
    time: "1 hr ago",
    description:
      "Stock is at 900 kg against a 1,000 kg minimum. Estimated 4 days of cover remaining.",
    link: "Grower Mash",
    action: "Reorder",
    unread: true,
  },
  {
    icon: "credit-card",
    tone: "warning",
    title: "Payment overdue",
    category: "Finance",
    time: "3 hrs ago",
    description:
      "Kola Poultry Traders has $3,420 outstanding, 18 days past terms.",
    link: "#ORD-2838",
    action: "Send reminder",
    unread: true,
  },
  {
    icon: "task",
    tone: "violet",
    title: "Task assigned to you",
    category: "Tasks",
    time: "4 hrs ago",
    description:
      'Amina Okoro assigned "Order layer feed" to you, due today at 14:00.',
    link: "Task #T-1184",
    action: "Open task",
    unread: true,
  },
  {
    icon: "calendar-x",
    tone: "warning",
    title: "Coccidiostat expiring in 10 days",
    category: "Inventory",
    time: "Yesterday",
    description:
      "Batch CCP-0288 expires 19 Aug 2026. Use or dispose before expiry.",
    link: "Batch CCP-0288",
    action: "View batch",
  },
  {
    icon: "receipt",
    tone: "success",
    title: "New order received",
    category: "Sales",
    time: "Yesterday",
    description: "Sunrise Supermarket placed order #ORD-2840 for $310.",
    link: "#ORD-2840",
    action: "View order",
  },
  {
    icon: "check",
    tone: "success",
    title: "Daily records complete",
    category: "System",
    time: "Yesterday",
    description: "All 6 houses submitted daily records before 09:00.",
    link: "09 Aug 2026",
    action: "View records",
  },
];

export type DeliveryPreference = {
  channel: string;
  scope: string;
  enabled: boolean;
};

export const deliveryPreferences: DeliveryPreference[] = [
  { channel: "In-app", scope: "All categories", enabled: true },
  { channel: "Email", scope: "Health & Finance only", enabled: true },
  { channel: "SMS", scope: "Critical alerts only", enabled: true },
  { channel: "WhatsApp", scope: "Disabled", enabled: false },
];

export const prioritySummary: { label: string; count: string; tone: Tone }[] = [
  { label: "Critical", count: "2", tone: "error" },
  { label: "Warning", count: "4", tone: "warning" },
  { label: "Informational", count: "6", tone: "info" },
];
