import "server-only";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";

import type { CalendarDay, CalendarEvent } from "@/components/ui/calendar-month";
import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { flocks, houses, users, vaccinations as table } from "@/lib/db/schema";

import {
  count,
  daysBetween,
  display,
  formatDate,
  formatTime,
  percent,
  VACCINATION_STATUS,
} from "./common";
import { toIsoDate } from "@/lib/date";

function isoDate(date: Date) {
  return toIsoDate(date);
}

/**
 * The grid always renders whole weeks starting on Monday, so it runs from the
 * Monday on or before the 1st to the Sunday on or after the last day.
 */
function monthGridRange(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);

  const start = new Date(first);
  // getDay() is 0 for Sunday; the grid's first column is Monday.
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));

  const end = new Date(last);
  end.setDate(last.getDate() + (7 - ((last.getDay() + 6) % 7) - 1));

  return { first, last, start, end };
}

const CALENDAR_TONE: Record<string, Tone> = {
  scheduled: "violet",
  completed: "success",
  overdue: "error",
  cancelled: "neutral",
};

/** Vaccination schedule laid out as a month grid. */
export async function getVaccinationCalendar(
  reference = new Date(),
): Promise<{ days: CalendarDay[]; label: string }> {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const { first, last, start, end } = monthGridRange(year, month);

  const rows = await db
    .select({
      scheduledOn: table.scheduledOn,
      vaccine: table.vaccine,
      status: table.status,
      flockCode: flocks.code,
    })
    .from(table)
    .leftJoin(flocks, eq(flocks.id, table.flockId))
    .where(
      and(gte(table.scheduledOn, isoDate(start)), lte(table.scheduledOn, isoDate(end))),
    )
    .orderBy(asc(table.scheduledOn), asc(table.scheduledAt));

  const byDay = new Map<string, CalendarEvent[]>();
  for (const row of rows) {
    // "Newcastle (Lasota)" → "Newcastle", "JF-2026-001" → "JF-001": the cells
    // are only ~90px wide, so both halves are shortened.
    const vaccine = row.vaccine.replace(/\s*\(.*\)$/, "");
    const flock = row.flockCode
      ? row.flockCode.replace(/^([A-Z]+)-\d{4}-(\d+)$/, "$1-$2")
      : "all";
    const events = byDay.get(row.scheduledOn) ?? [];
    events.push({
      label: `${vaccine} · ${flock}`,
      tone: CALENDAR_TONE[row.status] ?? "violet",
    });
    byDay.set(row.scheduledOn, events);
  }

  const today = isoDate(new Date());
  const days: CalendarDay[] = [];
  for (
    const cursor = new Date(start);
    cursor <= end;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const key = isoDate(cursor);
    days.push({
      day: cursor.getDate(),
      muted: cursor < first || cursor > last,
      today: key === today,
      events: byDay.get(key),
    });
  }

  return {
    days,
    label: first.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

export type VaccinationRow = {
  id: number;
  vaccine: string;
  route: string;
  flock: string;
  house: string;
  scheduled: string;
  scheduleNote: string;
  administeredBy: string;
  doses: string;
  status: string;
  statusTone: Tone;
  /** Raw enum value and dose count, for the row actions. */
  statusKey: string;
  doseCount: number;
};

export type VaccinationFilters = {
  search?: string;
  flock?: string;
  house?: string;
  status?: string;
};

export async function getVaccinations(
  filters: VaccinationFilters = {},
  limit = 50,
  offset = 0,
): Promise<VaccinationRow[]> {
  const conditions = [];

  if (filters.flock) conditions.push(eq(flocks.code, filters.flock));
  if (filters.house) conditions.push(eq(houses.code, filters.house));
  if (filters.status) {
    conditions.push(sql`${table.status}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${table.vaccine}) like ${term} or lower(coalesce(${flocks.code}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      vaccine: table.vaccine,
      route: table.route,
      scheduledOn: table.scheduledOn,
      scheduledAt: table.scheduledAt,
      administeredAt: table.administeredAt,
      doses: table.doses,
      status: table.status,
      flockCode: flocks.code,
      houseName: houses.name,
      administeredBy: users.name,
    })
    .from(table)
    .leftJoin(flocks, eq(flocks.id, table.flockId))
    .leftJoin(houses, eq(houses.id, table.houseId))
    .leftJoin(users, eq(users.id, table.administeredById))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(table.scheduledOn))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(VACCINATION_STATUS, row.status);
    const dueIn = daysBetween(new Date(), row.scheduledOn);

    /*
     * The second line under the date carries whatever is most useful for the
     * row's state: the time it was given, how late it is, or the slot it is
     * booked into.
     */
    let scheduleNote: string;
    let label = statusDisplay.label;
    if (row.status === "completed") {
      scheduleNote = row.administeredAt
        ? `Completed ${formatTime(row.administeredAt)}`
        : "Completed";
    } else if (row.status === "overdue" || (row.status === "scheduled" && dueIn < 0)) {
      const late = Math.abs(dueIn);
      scheduleNote = `Overdue ${late} day${late === 1 ? "" : "s"}`;
      label = "Overdue";
    } else if (row.status === "cancelled") {
      scheduleNote = "Cancelled";
    } else {
      scheduleNote = formatTime(row.scheduledAt) === "—" ? "Scheduled" : formatTime(row.scheduledAt);
      if (dueIn === 0) label = "Due today";
      if (dueIn === 1) label = "Due tomorrow";
    }

    return {
      id: row.id,
      vaccine: row.vaccine,
      route: row.route,
      flock: row.flockCode ?? "All flocks",
      house: row.houseName ?? "All",
      scheduled: formatDate(row.scheduledOn),
      scheduleNote,
      administeredBy: row.administeredBy ?? "Unassigned",
      doses: count(row.doses),
      doseCount: row.doses,
      status: label,
      statusKey: row.status,
      statusTone:
        label === "Due today" || label === "Due tomorrow"
          ? "warning"
          : statusDisplay.tone,
    };
  });
}

export async function getVaccinationKpis() {
  const [row] = await db
    .select({
      upcoming: sql<number>`count(*) filter (where ${table.status} = 'scheduled' and ${table.scheduledOn} between current_date and current_date + 7)::int`,
      tomorrow: sql<number>`count(*) filter (where ${table.status} = 'scheduled' and ${table.scheduledOn} = current_date + 1)::int`,
      completedThisMonth: sql<number>`count(*) filter (where ${table.status} = 'completed' and ${table.scheduledOn} >= date_trunc('month', current_date))::int`,
      completedLastMonth: sql<number>`count(*) filter (where ${table.status} = 'completed' and ${table.scheduledOn} >= date_trunc('month', current_date) - interval '1 month' and ${table.scheduledOn} < date_trunc('month', current_date))::int`,
      overdue: sql<number>`count(*) filter (where ${table.status} = 'overdue')::int`,
      dueDoses: sql<number>`coalesce(sum(${table.doses}) filter (where ${table.status} in ('completed','overdue')), 0)::int`,
      givenDoses: sql<number>`coalesce(sum(${table.doses}) filter (where ${table.status} = 'completed'), 0)::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(table);

  const [overdueFlock] = await db
    .select({ code: flocks.code })
    .from(table)
    .innerJoin(flocks, eq(flocks.id, table.flockId))
    .where(eq(table.status, "overdue"))
    .orderBy(asc(table.scheduledOn))
    .limit(1);

  // Coverage is the share of doses that were due and actually administered.
  const coverage = row.dueDoses > 0 ? (row.givenDoses / row.dueDoses) * 100 : 100;

  return {
    upcoming: row.upcoming,
    tomorrow: row.tomorrow,
    completedThisMonth: row.completedThisMonth,
    completedChange: row.completedThisMonth - row.completedLastMonth,
    overdue: row.overdue,
    overdueFlock: overdueFlock?.code ?? null,
    coverage,
    coverageLabel: percent(coverage),
    total: row.total,
  };
}
