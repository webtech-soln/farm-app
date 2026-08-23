import "server-only";

import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  dailyRecords,
  flocks,
  houseReadings,
  houses as housesTable,
} from "@/lib/db/schema";

import {
  CHART_PRIMARY,
  CHART_WARNING,
  count,
  DONUT_COLORS,
  display,
  HOUSE_STATUS,
  percent,
} from "./common";
import { getFarmSettings } from "./settings";
import { todayIso } from "@/lib/date";

export type House = {
  id: string;
  name: string;
  flock: string;
  status: string;
  statusTone: Tone;
  birds: number;
  capacity: number;
  /** Occupancy percentage as printed on the board. */
  occupancy: number;
  /** Cumulative loss across the house's active flocks. */
  mortality: string;
  temp: number;
  tempOutOfBand?: boolean;
  humidity: number;
  feedToday: number;
  /** The board tints a near-full rail amber. */
  railTone?: "violet" | "warning";
  /** Numeric primary key, for form submissions. */
  dbId: number;
  /** Raw column values the edit form posts back. */
  code: string;
  statusKey: string;
  notes: string | null;
};

const today = todayIso;

/**
 * One row per house with its live flock summary, latest environment reading
 * and today's feed, which is everything the Farm Overview cards render.
 */
export async function getHouses(): Promise<House[]> {
  const settings = await getFarmSettings();

  const rows = await db
    .select({
      id: housesTable.id,
      code: housesTable.code,
      name: housesTable.name,
      capacity: housesTable.capacity,
      status: housesTable.status,
      notes: housesTable.notes,
      birds: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
      placed: sql<number>`coalesce(sum(${flocks.initialCount}), 0)::int`,
      flockLabel: sql<string | null>`
        string_agg(
          ${flocks.code} || ' · ' || ${flocks.breed} || ' · ' ||
          initcap(${flocks.type}::text),
          ' / ' order by ${flocks.code}
        )
      `,
    })
    .from(housesTable)
    .leftJoin(
      flocks,
      and(eq(flocks.houseId, housesTable.id), ne(flocks.status, "closed")),
    )
    .groupBy(housesTable.id)
    .orderBy(housesTable.code);

  if (rows.length === 0) return [];

  const houseIds = rows.map((row) => row.id);

  // Latest environment reading per house.
  const readings = await db
    .selectDistinctOn([houseReadings.houseId], {
      houseId: houseReadings.houseId,
      temperatureC: houseReadings.temperatureC,
      humidityPct: houseReadings.humidityPct,
    })
    .from(houseReadings)
    .where(inArray(houseReadings.houseId, houseIds))
    .orderBy(houseReadings.houseId, desc(houseReadings.recordedAt));

  const readingByHouse = new Map(readings.map((row) => [row.houseId, row]));

  const feedRows = await db
    .select({ houseId: dailyRecords.houseId, feedKg: dailyRecords.feedKg })
    .from(dailyRecords)
    .where(
      and(
        inArray(dailyRecords.houseId, houseIds),
        eq(dailyRecords.recordDate, today()),
      ),
    );

  const feedByHouse = new Map(
    feedRows.map((row) => [row.houseId, row.feedKg ?? 0]),
  );

  return rows.map((row) => {
    const reading = readingByHouse.get(row.id);
    const temp = Math.round(reading?.temperatureC ?? 0);
    const occupancy = row.capacity > 0 ? (row.birds / row.capacity) * 100 : 0;
    const statusDisplay = display(HOUSE_STATUS, row.status);

    return {
      id: row.code,
      dbId: row.id,
      code: row.code,
      statusKey: row.status,
      notes: row.notes,
      name: row.name,
      flock: row.flockLabel ?? "No active flock",
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      birds: row.birds,
      capacity: row.capacity,
      occupancy: Math.round(occupancy),
      mortality: percent(
        row.placed > 0 ? ((row.placed - row.birds) / row.placed) * 100 : 0,
      ),
      temp,
      tempOutOfBand:
        temp < settings.temperatureMinC || temp > settings.temperatureMaxC,
      humidity: Math.round(reading?.humidityPct ?? 0),
      feedToday: Math.round(feedByHouse.get(row.id) ?? 0),
      railTone: occupancy >= 98 ? ("warning" as const) : undefined,
    };
  });
}

export async function getHouseByCode(code: string) {
  const [house] = await db
    .select()
    .from(housesTable)
    .where(eq(housesTable.code, code))
    .limit(1);
  return house ?? null;
}

/** Lightweight list for the house pickers inside modals. */
export async function getHouseOptions() {
  return db
    .select({
      id: housesTable.id,
      code: housesTable.code,
      name: housesTable.name,
      capacity: housesTable.capacity,
    })
    .from(housesTable)
    .orderBy(housesTable.code);
}

export type SummaryMetric = {
  label: string;
  value: string;
  icon:
    | "warehouse"
    | "layout-grid"
    | "bird"
    | "layers"
    | "heart-pulse"
    | "shield-check";
  accent?: boolean;
};

export async function getFarmSummary(): Promise<SummaryMetric[]> {
  const [totals] = await db
    .select({
      houseCount: sql<number>`count(distinct ${housesTable.id})::int`,
      capacity: sql<number>`coalesce(sum(${housesTable.capacity}), 0)::int`,
    })
    .from(housesTable);

  const [flockTotals] = await db
    .select({
      activeFlocks: sql<number>`count(*)::int`,
      birds: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
      placed: sql<number>`coalesce(sum(${flocks.initialCount}), 0)::int`,
    })
    .from(flocks)
    .where(ne(flocks.status, "closed"));

  const lost = flockTotals.placed - flockTotals.birds;
  const mortalityPct =
    flockTotals.placed > 0 ? (lost / flockTotals.placed) * 100 : 0;

  const health =
    mortalityPct < 2 ? "Good" : mortalityPct < 3.5 ? "Fair" : "At risk";

  return [
    { label: "Total Houses", value: count(totals.houseCount), icon: "warehouse" },
    { label: "Total Capacity", value: count(totals.capacity), icon: "layout-grid" },
    { label: "Occupied", value: count(flockTotals.birds), icon: "bird" },
    { label: "Active Flocks", value: count(flockTotals.activeFlocks), icon: "layers" },
    { label: "Avg Mortality", value: percent(mortalityPct), icon: "heart-pulse" },
    { label: "Farm Health", value: health, icon: "shield-check", accent: true },
  ];
}

export type DonutSlice = {
  name: string;
  value: number;
  color: string;
  display: string;
};

/** Splits active flocks across the three health buckets on the board. */
export async function getHealthDistribution(): Promise<DonutSlice[]> {
  const rows = await db
    .select({ status: flocks.status, total: sql<number>`count(*)::int` })
    .from(flocks)
    .where(ne(flocks.status, "closed"))
    .groupBy(flocks.status);

  const bucket = { healthy: 0, monitoring: 0, treatment: 0 };
  for (const row of rows) {
    if (row.status === "healthy" || row.status === "brooding") {
      bucket.healthy += row.total;
    } else if (row.status === "warning") {
      bucket.monitoring += row.total;
    } else {
      bucket.treatment += row.total;
    }
  }

  const total = bucket.healthy + bucket.monitoring + bucket.treatment;
  const share = (value: number) =>
    total > 0 ? `${value} · ${((value / total) * 100).toFixed(1)}%` : "0 · 0%";

  return [
    { name: "Healthy", value: bucket.healthy, color: DONUT_COLORS[0], display: share(bucket.healthy) },
    { name: "Monitoring", value: bucket.monitoring, color: DONUT_COLORS[2], display: share(bucket.monitoring) },
    { name: "Under treatment", value: bucket.treatment, color: CHART_WARNING, display: share(bucket.treatment) },
  ];
}

/** Column chart of the current temperature in every house. */
export async function getTemperatureByHouse() {
  const houses = await getHouses();
  return {
    outOfBand: houses.filter((house) => house.tempOutOfBand).length,
    data: houses.map((house) => ({
      label: house.name.replace("House ", "H"),
      value: house.temp,
      display: `${house.temp}°`,
      color: house.tempOutOfBand ? CHART_WARNING : CHART_PRIMARY,
      labelClassName: house.tempOutOfBand
        ? "text-xs font-semibold text-warning"
        : "text-xs font-semibold text-ink-2",
    })),
  };
}
