import "server-only";

import { and, asc, desc, eq, gte, ne, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  flocks as flocksTable,
  houses,
  weightRecords,
} from "@/lib/db/schema";

import {
  count,
  daysBetween,
  decimal,
  display,
  FLOCK_STATUS,
  formatAge,
  formatDate,
  percent,
} from "./common";
import { getFarmSettings } from "./settings";
import { toIsoDate } from "@/lib/date";

export type Flock = {
  id: string;
  started: string;
  type: string;
  breed: string;
  house: string;
  initial: string;
  current: string;
  age: string;
  mortality: string;
  /** Colour the board applies to the mortality figure. */
  mortalityTone: Tone | "ink";
  weight: string;
  status: string;
  statusTone: Tone;
  dbId: number;
};

export type FlockFilters = {
  search?: string;
  house?: string;
  breed?: string;
  type?: string;
  status?: string;
  /** Column the register is ordered by; defaults to the flock code. */
  sort?: string;
};

/**
 * Mortality is derived from the placement versus the live count, so it always
 * agrees with the flock record rather than being stored twice.
 */
function mortalityFor(initial: number, current: number) {
  if (initial <= 0) return 0;
  return ((initial - current) / initial) * 100;
}

async function mortalityTone(pct: number): Promise<Tone | "ink"> {
  const settings = await getFarmSettings();
  if (pct >= settings.weeklyMortalityAlertPct * 1.4) return "error";
  if (pct >= settings.weeklyMortalityAlertPct) return "warning";
  if (pct <= settings.weeklyMortalityAlertPct * 0.75) return "success";
  return "ink";
}

export async function getFlocks(filters: FlockFilters = {}): Promise<Flock[]> {
  const conditions = [];

  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${flocksTable.code}) like ${term} or lower(${flocksTable.breed}) like ${term})`,
    );
  }
  if (filters.house) conditions.push(eq(houses.code, filters.house));
  if (filters.breed) conditions.push(eq(flocksTable.breed, filters.breed));
  if (filters.type && (filters.type === "broiler" || filters.type === "layer")) {
    conditions.push(eq(flocksTable.type, filters.type));
  }
  if (filters.status) {
    conditions.push(
      sql`${flocksTable.status}::text = ${filters.status.toLowerCase()}`,
    );
  }

  const rows = await db
    .select({
      id: flocksTable.id,
      code: flocksTable.code,
      type: flocksTable.type,
      breed: flocksTable.breed,
      initialCount: flocksTable.initialCount,
      currentCount: flocksTable.currentCount,
      startedOn: flocksTable.startedOn,
      closedOn: flocksTable.closedOn,
      status: flocksTable.status,
      houseName: houses.name,
      /*
       * The outer column has to be written out in full: drizzle interpolates
       * a column reference unqualified, and a bare `id` inside a subquery
       * binds to the subquery's own table instead of correlating.
       */
      latestWeight: sql<number | null>`(
        select avg_weight_kg from weight_records
        where weight_records.flock_id = flocks.id
        order by weight_records.recorded_on desc
        limit 1
      )`,
      recordedDeaths: sql<number>`(
        select coalesce(sum(deaths), 0)::int from mortality_records
        where mortality_records.flock_id = flocks.id
      )`,
    })
    .from(flocksTable)
    .leftJoin(houses, eq(houses.id, flocksTable.houseId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      filters.sort === "newest"
        ? desc(flocksTable.startedOn)
        : filters.sort === "oldest"
          ? asc(flocksTable.startedOn)
          : filters.sort === "birds"
            ? desc(flocksTable.currentCount)
            : asc(flocksTable.code),
    );

  return Promise.all(
    rows.map(async (row) => {
      /*
       * A live flock's losses are the gap between placement and the running
       * count. Once a flock closes its birds have been sold, so the count
       * drops to zero and only the recorded deaths describe its mortality.
       */
      const pct =
        row.status === "closed"
          ? mortalityFor(row.initialCount, row.initialCount - row.recordedDeaths)
          : mortalityFor(row.initialCount, row.currentCount);
      const statusDisplay = display(FLOCK_STATUS, row.status);

      return {
        id: row.code,
        dbId: row.id,
        started: row.closedOn
          ? `Closed ${formatDate(row.closedOn)}`
          : `Started ${formatDate(row.startedOn)}`,
        type: row.type === "broiler" ? "Broiler" : "Layer",
        breed: row.breed,
        house: row.houseName ?? "Unassigned",
        initial: count(row.initialCount),
        current: count(row.currentCount),
        age: formatAge(row.startedOn, row.type, row.closedOn),
        mortality: percent(pct),
        mortalityTone:
          row.status === "closed" ? "neutral" : await mortalityTone(pct),
        weight:
          row.type === "layer" || row.latestWeight === null
            ? "—"
            : `${decimal(row.latestWeight, 2)} kg`,
        status: statusDisplay.label,
        statusTone: statusDisplay.tone,
      };
    }),
  );
}

export async function getFlockByCode(code: string) {
  const [flock] = await db
    .select()
    .from(flocksTable)
    .where(eq(flocksTable.code, code))
    .limit(1);
  return flock ?? null;
}

export type FlockFormValues = {
  dbId: number;
  code: string;
  houseId: number | null;
  type: string;
  breed: string;
  initialCount: number;
  currentCount: number;
  startedOn: string;
  closedOn: string | null;
  status: string;
  sourceHatchery: string | null;
  notes: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getFlockFormValues(): Promise<Map<number, FlockFormValues>> {
  const rows = await db
    .select({
      dbId: flocksTable.id,
      code: flocksTable.code,
      houseId: flocksTable.houseId,
      type: flocksTable.type,
      breed: flocksTable.breed,
      initialCount: flocksTable.initialCount,
      currentCount: flocksTable.currentCount,
      startedOn: flocksTable.startedOn,
      closedOn: flocksTable.closedOn,
      status: flocksTable.status,
      sourceHatchery: flocksTable.sourceHatchery,
      notes: flocksTable.notes,
    })
    .from(flocksTable);

  return new Map(rows.map((row) => [row.dbId, row]));
}

/** Options for the flock pickers inside modals. */
export async function getFlockOptions(options: { activeOnly?: boolean } = {}) {
  return db
    .select({
      id: flocksTable.id,
      code: flocksTable.code,
      breed: flocksTable.breed,
      type: flocksTable.type,
      houseId: flocksTable.houseId,
      currentCount: flocksTable.currentCount,
    })
    .from(flocksTable)
    .where(options.activeOnly ? ne(flocksTable.status, "closed") : undefined)
    .orderBy(asc(flocksTable.code));
}

/** Distinct values powering the flock filter bar. */
export async function getFlockFilterOptions() {
  const [houseRows, breedRows] = await Promise.all([
    db
      .select({ code: houses.code, name: houses.name })
      .from(houses)
      .orderBy(houses.code),
    db
      .selectDistinct({ breed: flocksTable.breed })
      .from(flocksTable)
      .orderBy(flocksTable.breed),
  ]);

  return {
    houses: houseRows.map((row) => ({ value: row.code, label: row.name })),
    breeds: breedRows.map((row) => ({ value: row.breed, label: row.breed })),
    types: [
      { value: "broiler", label: "Broiler" },
      { value: "layer", label: "Layer" },
    ],
    statuses: Object.entries(FLOCK_STATUS).map(([value, meta]) => ({
      value,
      label: meta.label,
    })),
  };
}

export async function getFlockKpis() {
  const [totals] = await db
    .select({
      activeFlocks: sql<number>`count(*)::int`,
      birds: sql<number>`coalesce(sum(${flocksTable.currentCount}), 0)::int`,
      placed: sql<number>`coalesce(sum(${flocksTable.initialCount}), 0)::int`,
    })
    .from(flocksTable)
    .where(ne(flocksTable.status, "closed"));

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [startedThisMonth] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(flocksTable)
    .where(gte(flocksTable.startedOn, toIsoDate(startOfMonth)));

  const broilers = await db
    .select({ startedOn: flocksTable.startedOn })
    .from(flocksTable)
    .where(
      and(eq(flocksTable.type, "broiler"), ne(flocksTable.status, "closed")),
    );

  const averageAge =
    broilers.length > 0
      ? Math.round(
          broilers.reduce((sum, row) => sum + daysBetween(row.startedOn), 0) /
            broilers.length,
        )
      : 0;

  const mortalityPct =
    totals.placed > 0
      ? ((totals.placed - totals.birds) / totals.placed) * 100
      : 0;

  const [statusCounts] = await db
    .select({
      active: sql<number>`count(*) filter (where ${flocksTable.status} in ('healthy','warning','treatment'))::int`,
      brooding: sql<number>`count(*) filter (where ${flocksTable.status} = 'brooding')::int`,
      closed: sql<number>`count(*) filter (where ${flocksTable.status} = 'closed')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(flocksTable);

  const [houseCount] = await db
    .select({
      total: sql<number>`count(distinct ${flocksTable.houseId})::int`,
    })
    .from(flocksTable)
    .where(ne(flocksTable.status, "closed"));

  return {
    activeFlocks: totals.activeFlocks,
    totalBirds: totals.birds,
    startedThisMonth: startedThisMonth.total,
    averageAgeDays: averageAge,
    mortalityPct,
    housesInUse: houseCount.total,
    counts: statusCounts,
  };
}

/** Recent weight samples for the Weight Records board. */
export async function getWeightRecords(limit = 40) {
  const rows = await db
    .select({
      id: weightRecords.id,
      recordedOn: weightRecords.recordedOn,
      ageDays: weightRecords.ageDays,
      avgWeightKg: weightRecords.avgWeightKg,
      standardWeightKg: weightRecords.standardWeightKg,
      sampleSize: weightRecords.sampleSize,
      uniformityPct: weightRecords.uniformityPct,
      flockCode: flocksTable.code,
      houseName: houses.name,
    })
    .from(weightRecords)
    .innerJoin(flocksTable, eq(flocksTable.id, weightRecords.flockId))
    .leftJoin(houses, eq(houses.id, weightRecords.houseId))
    .orderBy(desc(weightRecords.recordedOn), desc(weightRecords.id))
    .limit(limit);

  return rows.map((row) => {
    const variance =
      row.standardWeightKg && row.standardWeightKg > 0
        ? ((row.avgWeightKg - row.standardWeightKg) / row.standardWeightKg) * 100
        : null;

    return {
      id: row.id,
      date: formatDate(row.recordedOn),
      flock: row.flockCode,
      house: row.houseName ?? "—",
      age: row.ageDays ? `${row.ageDays} days` : "—",
      weight: `${decimal(row.avgWeightKg, 2)} kg`,
      standard: row.standardWeightKg
        ? `${decimal(row.standardWeightKg, 2)} kg`
        : "—",
      variance: variance === null ? "—" : `${variance > 0 ? "+" : ""}${variance.toFixed(1)}%`,
      varianceTone: (variance === null
        ? "neutral"
        : variance >= 0
          ? "success"
          : "warning") as Tone,
      sample: count(row.sampleSize),
      uniformity: row.uniformityPct ? percent(row.uniformityPct, 0) : "—",
    };
  });
}
