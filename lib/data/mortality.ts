import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { flocks, houses, mortalityRecords, users } from "@/lib/db/schema";

import {
  axis,
  CHART_PRIMARY,
  CHART_WARNING,
  count,
  display,
  DONUT_COLORS,
  formatDate,
  formatTime,
  MORTALITY_STATUS,
  percent,
  recentDays,
} from "./common";
import { getFarmSettings } from "./settings";
import { isoDaysAgo } from "@/lib/date";

export type MortalityRecordRow = {
  id: number;
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
  /** Raw enum value the status dialog posts back. */
  statusKey: string;
};

export type MortalityFilters = {
  search?: string;
  flock?: string;
  house?: string;
  cause?: string;
  status?: string;
  days?: number;
};

const isoDay = isoDaysAgo;

/** Daily deaths for the last 14 days, ambered above the per-flock threshold. */
export async function getMortalityTrend(days = 14) {
  const range = recentDays(days, "dayOfMonth");
  const settings = await getFarmSettings();

  const rows = await db
    .select({
      day: mortalityRecords.occurredOn,
      total: sql<number>`sum(${mortalityRecords.deaths})::int`,
      peakPerFlock: sql<number>`max(${mortalityRecords.deaths})::int`,
    })
    .from(mortalityRecords)
    .where(gte(mortalityRecords.occurredOn, range[0].key))
    .groupBy(mortalityRecords.occurredOn);

  const byDay = new Map(rows.map((row) => [row.day, row]));
  const values = range.map((entry) => byDay.get(entry.key)?.total ?? 0);

  // 15 deaths in one flock in a day is the board's alert level.
  const alertLevel = Math.max(15, settings.dailyMortalityAlertPct * 40);
  const colors = range.map((entry) =>
    (byDay.get(entry.key)?.peakPerFlock ?? 0) >= alertLevel
      ? CHART_WARNING
      : CHART_PRIMARY,
  );

  const { max, ticks } = axis(Math.max(...values, 1));
  return { labels: range.map((entry) => entry.label), ticks, max, values, colors };
}

export async function getMortalityByCause(days = 30) {
  const rows = await db
    .select({
      cause: mortalityRecords.cause,
      total: sql<number>`sum(${mortalityRecords.deaths})::int`,
    })
    .from(mortalityRecords)
    .where(gte(mortalityRecords.occurredOn, isoDay(days)))
    .groupBy(mortalityRecords.cause)
    .orderBy(desc(sql`sum(${mortalityRecords.deaths})`))
    .limit(6);

  return rows.map((row, index) => ({
    name: row.cause,
    value: row.total,
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: count(row.total),
  }));
}

export async function getMortalityRecords(
  filters: MortalityFilters = {},
  limit = 50,
  offset = 0,
): Promise<MortalityRecordRow[]> {
  const settings = await getFarmSettings();
  const conditions = [];

  if (filters.days) conditions.push(gte(mortalityRecords.occurredOn, isoDay(filters.days)));
  if (filters.flock) conditions.push(eq(flocks.code, filters.flock));
  if (filters.house) conditions.push(eq(houses.code, filters.house));
  if (filters.cause) conditions.push(eq(mortalityRecords.cause, filters.cause));
  if (filters.status) {
    conditions.push(sql`${mortalityRecords.status}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${flocks.code}) like ${term} or lower(${mortalityRecords.cause}) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: mortalityRecords.id,
      occurredOn: mortalityRecords.occurredOn,
      occurredAt: mortalityRecords.occurredAt,
      deaths: mortalityRecords.deaths,
      cause: mortalityRecords.cause,
      status: mortalityRecords.status,
      flockCode: flocks.code,
      flockCurrent: flocks.currentCount,
      houseName: houses.name,
      recordedBy: users.name,
    })
    .from(mortalityRecords)
    .innerJoin(flocks, eq(flocks.id, mortalityRecords.flockId))
    .leftJoin(houses, eq(houses.id, mortalityRecords.houseId))
    .leftJoin(users, eq(users.id, mortalityRecords.recordedById))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(mortalityRecords.occurredOn), desc(mortalityRecords.occurredAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(MORTALITY_STATUS, row.status);
    const dailyPct =
      row.flockCurrent > 0 ? (row.deaths / row.flockCurrent) * 100 : 0;

    return {
      id: row.id,
      date: formatDate(row.occurredOn),
      time: formatTime(row.occurredAt),
      flock: row.flockCode,
      house: row.houseName ?? "—",
      deaths: count(row.deaths),
      deathsAlert: dailyPct >= settings.dailyMortalityAlertPct,
      cause: row.cause,
      recordedBy: row.recordedBy ?? "System",
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusKey: row.status,
    };
  });
}

export async function getMortalityKpis() {
  const [totals] = await db
    .select({
      today: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} = ${isoDay(0)}), 0)::int`,
      week: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} >= ${isoDay(6)}), 0)::int`,
      previousWeek: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} >= ${isoDay(13)} and ${mortalityRecords.occurredOn} < ${isoDay(6)}), 0)::int`,
      month: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} >= ${isoDay(29)}), 0)::int`,
      openCases: sql<number>`count(*) filter (where ${mortalityRecords.status} in ('escalated','under_treatment'))::int`,
    })
    .from(mortalityRecords);

  const [birds] = await db
    .select({
      total: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
    })
    .from(flocks)
    .where(sql`${flocks.status} <> 'closed'`);

  const base = birds.total || 1;

  return {
    today: totals.today,
    week: totals.week,
    month: totals.month,
    openCases: totals.openCases,
    weeklyRatePct: (totals.week / base) * 100,
    weeklyRateLabel: percent((totals.week / base) * 100, 2),
    weekChange: totals.week - totals.previousWeek,
  };
}

/** Distinct causes, for the filter bar and the cause picker in the modal. */
export async function getMortalityCauses() {
  const rows = await db
    .selectDistinct({ cause: mortalityRecords.cause })
    .from(mortalityRecords)
    .orderBy(mortalityRecords.cause);
  return rows.map((row) => row.cause);
}
