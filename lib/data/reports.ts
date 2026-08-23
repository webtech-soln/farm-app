import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { reports as table, users } from "@/lib/db/schema";

import { display, formatDate, relativeTime } from "./common";

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
  key: string;
  name: string;
  icon: ReportIcon;
  description: string;
  lastGenerated: string;
};

/**
 * The catalogue of reports the farm can run. This is a fixed set of report
 * definitions in code — the `reports` table records the runs, not the kinds —
 * and each card is annotated with when it last produced output.
 */
const CATALOGUE: Omit<ReportCard, "lastGenerated">[] = [
  {
    key: "farm-performance",
    name: "Farm Performance",
    icon: "chart-column",
    description:
      "Whole-farm KPIs: birds, production, mortality and cost per bird.",
  },
  {
    key: "flock-performance",
    name: "Flock Performance",
    icon: "bird",
    description:
      "Per-flock growth, FCR, uniformity and mortality against standard.",
  },
  {
    key: "feed-consumption",
    name: "Feed Consumption",
    icon: "wheat",
    description: "Intake per house and flock, cost per kg and stock movement.",
  },
  {
    key: "egg-production",
    name: "Egg Production",
    icon: "egg",
    description: "Hen-day rate, grade split, breakages and wastage.",
  },
  {
    key: "mortality",
    name: "Mortality Report",
    icon: "heart-pulse",
    description:
      "Deaths by flock, house, cause and week with threshold breaches.",
  },
  {
    key: "health-vet",
    name: "Health & Vet",
    icon: "stethoscope",
    description:
      "Disease events, treatments, vaccination coverage and vet visits.",
  },
  {
    key: "inventory",
    name: "Inventory Report",
    icon: "package",
    description: "Stock on hand, valuation, low stock and expiring items.",
  },
  {
    key: "sales",
    name: "Sales Report",
    icon: "shopping-bag",
    description:
      "Orders, revenue by product and customer, outstanding balances.",
  },
  {
    key: "financial-statement",
    name: "Financial Statement",
    icon: "banknote",
    description: "P&L, expenses by category, margin and cash position.",
  },
];

export const reportFormats = ["PDF", "Excel", "CSV"];

export async function getReportCards(): Promise<ReportCard[]> {
  const rows = await db
    .select({
      key: table.reportKey,
      lastRun: sql<Date>`max(${table.generatedAt})`,
    })
    .from(table)
    .where(eq(table.status, "ready"))
    .groupBy(table.reportKey);

  const lastRunByKey = new Map(rows.map((row) => [row.key, row.lastRun]));

  return CATALOGUE.map((entry) => {
    const lastRun = lastRunByKey.get(entry.key);
    return {
      ...entry,
      lastGenerated: lastRun
        ? `Last generated ${relativeTime(new Date(lastRun))}`
        : "Never generated",
    };
  });
}

export type GeneratedReportRow = {
  id: number;
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

const REPORT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ready: { label: "Ready", tone: "success" },
  queued: { label: "Queued", tone: "neutral" },
  generating: { label: "Generating", tone: "info" },
  failed: { label: "Failed", tone: "error" },
};

/** `1258291` → `1.2 MB`, matching how the register prints file sizes. */
function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export async function getGeneratedReports(
  limit = 25,
  offset = 0,
  origin?: string,
): Promise<GeneratedReportRow[]> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      origin: table.origin,
      scheduleLabel: table.scheduleLabel,
      periodStart: table.periodStart,
      periodEnd: table.periodEnd,
      periodLabel: table.periodLabel,
      format: table.format,
      sizeBytes: table.sizeBytes,
      status: table.status,
      generatedAt: table.generatedAt,
      generatedBy: users.name,
    })
    .from(table)
    .leftJoin(users, eq(users.id, table.generatedById))
    .where(origin ? sql`${table.origin}::text = ${origin}` : undefined)
    .orderBy(desc(table.generatedAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(REPORT_STATUS, row.status);
    return {
      id: row.id,
      name: row.name,
      origin:
        row.origin === "scheduled"
          ? `Scheduled · ${row.scheduleLabel ?? "recurring"}`
          : "Manual",
      // An explicit start/end beats the stored label, which is relative.
      period:
        row.periodStart && row.periodEnd
          ? `${formatDate(row.periodStart)} – ${formatDate(row.periodEnd)}`
          : (row.periodLabel ?? "—"),
      format: row.format.toUpperCase(),
      size: fileSize(row.sizeBytes),
      // A scheduled run has no author; the scheduler produced it.
      generatedBy: row.generatedBy ?? "System",
      when: relativeTime(row.generatedAt),
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
    };
  });
}

export async function getReportKpis() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(*) filter (where ${table.generatedAt} >= date_trunc('month', current_date))::int`,
      scheduled: sql<number>`count(distinct ${table.reportKey}) filter (where ${table.origin} = 'scheduled')::int`,
      failed: sql<number>`count(*) filter (where ${table.status} = 'failed')::int`,
    })
    .from(table);

  return {
    total: row.total,
    thisMonth: row.thisMonth,
    scheduled: row.scheduled,
    failed: row.failed,
    available: CATALOGUE.length,
  };
}
