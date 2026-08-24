import "server-only";

import type { Tone } from "@/components/ui/tone";
import { CURRENCY_LOCALE, CURRENCY_SYMBOL } from "@/lib/currency";
import { toIsoDate } from "@/lib/date";

/**
 * Shared presentation helpers for the data layer. The boards render figures as
 * pre-formatted strings, so the queries in this folder return the same display
 * shapes the components already consume — the mapping lives here rather than
 * being repeated in every module.
 */

export function money(cents: number, options: { compact?: boolean } = {}) {
  const amount = cents / 100;
  if (options.compact) {
    if (Math.abs(amount) >= 1_000_000) {
      return `${CURRENCY_SYMBOL}${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1_000) {
      return `${CURRENCY_SYMBOL}${Math.round(amount / 1_000)}k`;
    }
  }
  const rounded = Number.isInteger(amount) ? amount : Number(amount.toFixed(2));
  return `${CURRENCY_SYMBOL}${rounded.toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function count(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

export function decimal(value: number, digits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function percent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

export function signedPercent(value: number, digits = 1) {
  return `${value > 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

/** `2026-08-09` or a Date → `09 Aug 2026`, matching the board's date format. */
export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** `08:12` from a Date or a `HH:MM:SS` time column. */
export function formatTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  if (typeof value === "string") return value.slice(0, 5);
  return value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Today · 08:12", "Yesterday", "3 days ago", falling back to a date. */
export function relativeTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = Date.now() - date.getTime();

  // Scheduled work (vaccinations, deliveries, due tasks) is dated ahead, so
  // the same helper has to read forwards as well as back.
  if (diffMs < 0) {
    const ahead = daysBetween(new Date(), date);
    if (ahead === 0) return `Today · ${formatTime(date)}`;
    if (ahead === 1) return "Tomorrow";
    if (ahead < 7) return `In ${ahead} days`;
    return formatDate(date);
  }

  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24 && isSameDay(date, new Date())) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = daysBetween(date, new Date());
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(date);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function daysBetween(from: Date | string, to: Date | string = new Date()) {
  const start = typeof from === "string" ? new Date(`${from}T00:00:00`) : from;
  const end = typeof to === "string" ? new Date(`${to}T00:00:00`) : to;
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.round((endDay.getTime() - startDay.getTime()) / 86_400_000);
}

/**
 * Broilers are tracked in days and layers in weeks, which is how the Flocks
 * board prints them.
 */
export function formatAge(
  startedOn: string,
  type: "broiler" | "layer",
  closedOn?: string | null,
) {
  if (closedOn) return "—";
  const days = daysBetween(startedOn);
  if (days < 0) return "—";
  if (type === "layer") return `${Math.floor(days / 7)} weeks`;
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * Reference daily intake in grams per bird. Broilers ramp with age, layers sit
 * flat once in production. These are breed-guide figures, not farm records —
 * they only back the "standard" series the feed charts plot against actuals.
 */
const BROILER_INTAKE_G = [
  { day: 0, grams: 13 },
  { day: 7, grams: 28 },
  { day: 14, grams: 55 },
  { day: 21, grams: 85 },
  { day: 28, grams: 115 },
  { day: 35, grams: 145 },
  { day: 42, grams: 170 },
];

const LAYER_INTAKE_G = 115;

export function standardIntakeGrams(ageDays: number, type: "broiler" | "layer") {
  if (type === "layer") return LAYER_INTAKE_G;

  const last = BROILER_INTAKE_G.at(-1)!;
  if (ageDays >= last.day) return last.grams;

  for (let index = 1; index < BROILER_INTAKE_G.length; index += 1) {
    const upper = BROILER_INTAKE_G[index];
    if (ageDays > upper.day) continue;
    const lower = BROILER_INTAKE_G[index - 1];
    const span = upper.day - lower.day;
    const ratio = span === 0 ? 0 : (ageDays - lower.day) / span;
    return lower.grams + (upper.grams - lower.grams) * ratio;
  }

  return last.grams;
}

/** The standard-curve counterpart to a day's recorded feed, in whole kg. */
export function standardFeedKg(
  birds: number,
  startedOn: string,
  onDate: string,
  type: "broiler" | "layer",
) {
  const ageDays = daysBetween(startedOn, onDate);
  return Math.round((birds * standardIntakeGrams(ageDays, type)) / 1000);
}

export function initialsFor(name: string) {
  const parts = name
    .replace(/\b(dr|mr|mrs|ms|prof)\.?\s+/gi, "")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** "Amina Okoro" → "Amina O.", the short form used in table sub-rows. */
export function shortName(name: string | null | undefined) {
  if (!name) return "Unassigned";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return name;
  if (/^(dr|mr|mrs|ms|prof)\.?$/i.test(parts[0])) {
    return `${parts[0]} ${parts[1]}`;
  }
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/** Turns `in_treatment` into `In treatment`. */
export function humanise(value: string) {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/* -------------------------------------------------------------------------- */
/* Status → label + tone                                                      */
/* -------------------------------------------------------------------------- */

type Display = { label: string; tone: Tone };

export const HOUSE_STATUS: Record<string, Display> = {
  healthy: { label: "Healthy", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
  brooding: { label: "Brooding", tone: "info" },
  maintenance: { label: "Maintenance", tone: "neutral" },
  empty: { label: "Empty", tone: "neutral" },
};

export const FLOCK_STATUS: Record<string, Display> = {
  healthy: { label: "Healthy", tone: "success" },
  warning: { label: "Warning", tone: "warning" },
  brooding: { label: "Brooding", tone: "info" },
  treatment: { label: "Treatment", tone: "error" },
  closed: { label: "Closed", tone: "neutral" },
};

export const MORTALITY_STATUS: Record<string, Display> = {
  pending: { label: "Pending", tone: "neutral" },
  reviewed: { label: "Reviewed", tone: "success" },
  under_treatment: { label: "Under treatment", tone: "warning" },
  escalated: { label: "Escalated", tone: "error" },
};

export const HEALTH_STATUS: Record<string, Display> = {
  escalated: { label: "Escalated", tone: "error" },
  in_treatment: { label: "In treatment", tone: "warning" },
  monitoring: { label: "Monitoring", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
};

export const VACCINATION_STATUS: Record<string, Display> = {
  scheduled: { label: "Scheduled", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  overdue: { label: "Overdue", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const COLLECTION_STATUS: Record<string, Display> = {
  synced: { label: "Synced", tone: "success" },
  pending_sync: { label: "Pending sync", tone: "info" },
  needs_review: { label: "Needs review", tone: "warning" },
};

export const ORDER_STATUS: Record<string, Display> = {
  pending: { label: "Pending", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "info" },
  preparing: { label: "Preparing", tone: "warning" },
  ready: { label: "Ready", tone: "info" },
  in_transit: { label: "In transit", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "error" },
};

export const PAYMENT_STATUS: Record<string, Display> = {
  unpaid: { label: "Unpaid", tone: "error" },
  partial: { label: "Partial", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const DELIVERY_STATUS: Record<string, Display> = {
  scheduled: { label: "Scheduled", tone: "neutral" },
  preparing: { label: "Preparing", tone: "warning" },
  in_transit: { label: "In transit", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  failed: { label: "Failed", tone: "error" },
};

export const APPROVAL_STATUS: Record<string, Display> = {
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "error" },
};

export const SUPPLIER_STATUS: Record<string, Display> = {
  active: { label: "Active", tone: "success" },
  inactive: { label: "Inactive", tone: "neutral" },
  overdue: { label: "Overdue", tone: "error" },
};

export const CUSTOMER_STATUS: Record<string, Display> = {
  active: { label: "Active", tone: "success" },
  dormant: { label: "Dormant", tone: "neutral" },
  overdue: { label: "Overdue", tone: "error" },
};

export const PRODUCT_STATUS: Record<string, Display> = {
  in_stock: { label: "In stock", tone: "success" },
  low_stock: { label: "Low stock", tone: "warning" },
  out_of_stock: { label: "Out of stock", tone: "error" },
};

export const DUTY_STATUS: Record<string, Display> = {
  on_duty: { label: "On duty", tone: "success" },
  visiting: { label: "Visiting", tone: "info" },
  on_road: { label: "On road", tone: "info" },
  on_leave: { label: "On leave", tone: "neutral" },
  off_duty: { label: "Off duty", tone: "neutral" },
};

export const TASK_PRIORITY: Record<string, Display> = {
  high: { label: "High", tone: "error" },
  medium: { label: "Medium", tone: "warning" },
  low: { label: "Low", tone: "violet" },
};

export const CUSTOMER_TYPE: Record<string, string> = {
  wholesaler: "Wholesaler",
  retailer: "Retailer",
  restaurant: "Restaurant",
  walk_in: "Walk-in",
};

export const PAYMENT_METHOD: Record<string, string> = {
  bank_transfer: "Bank transfer",
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile money",
  cheque: "Cheque",
  part_cash: "Part cash",
};

export const DELIVERY_METHOD: Record<string, string> = {
  own_fleet: "Own fleet",
  pickup: "Pickup",
  third_party: "3rd party",
};

export const EXPENSE_CATEGORY: Record<string, string> = {
  feed: "Feed",
  labour: "Labour",
  medicine: "Medicine",
  utilities: "Utilities",
  transport: "Transport",
  maintenance: "Maintenance",
  other: "Other",
};

export const INVENTORY_CATEGORY: Record<string, string> = {
  feed: "Feed",
  medicine: "Medicine",
  equipment: "Equipment",
  packaging: "Packaging",
  consumable: "Consumable",
  other: "Other",
};

export function display(map: Record<string, Display>, key: string): Display {
  return map[key] ?? { label: humanise(key), tone: "neutral" };
}

/** The violet ramp the donut charts use, in order. */
export const DONUT_COLORS = [
  "#7C3AED",
  "#A78BFA",
  "#C4B5FD",
  "#DDD6FE",
  "#EDE9FE",
  "#E4E4E7",
];

export const CHART_PRIMARY = "#7C3AED";
export const CHART_WARNING = "#F59E0B";

/** Rounds a maximum up to a friendly axis bound and derives evenly spaced ticks. */
export function axis(max: number, tickCount = 4, format?: (value: number) => string) {
  const safeMax = max <= 0 ? 1 : max;

  /*
   * Steps are rounded up to a 1 / 2 / 2.5 / 5 / 10 multiple so the gridlines
   * land on readable numbers. A raw step would round to the same label twice
   * — an axis reading "3k, 2k, 2k, 1k, 0" for 3000/2250/1500/750/0.
   */
  const rawStep = safeMax / (tickCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude;
  const niceStep = Math.max(
    1,
    magnitude *
      (normalised <= 1
        ? 1
        : normalised <= 2
          ? 2
          : normalised <= 2.5
            ? 2.5
            : normalised <= 5
              ? 5
              : 10),
  );

  const bound = niceStep * (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, index) => {
    const value = bound - index * niceStep;
    return format ? format(value) : count(value);
  });

  return { max: bound, ticks };
}

/**
 * Axis tick label. Keeps one decimal above a thousand — rounding 1,500 to
 * "2k" both overstates the gridline and can repeat the label above it.
 */
export function compactTick(value: number) {
  if (Math.abs(value) < 1000) return String(Math.round(value));
  const thousands = value / 1000;
  return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}k`;
}

export function recentMonths(months: number) {
  const now = new Date();
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      start: date,
    };
  });
}

/** Day labels for the last `days` days, oldest first. */
export function recentDays(days: number, format: "weekday" | "dayOfMonth" = "weekday") {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - index));
    return {
      key: toIsoDate(date),
      label:
        format === "weekday"
          ? date.toLocaleDateString("en-US", { weekday: "short" })
          : String(date.getDate()).padStart(2, "0"),
      date,
    };
  });
}

/** Percentage change from `previous` to `current`, guarding divide-by-zero. */
export function changePct(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
