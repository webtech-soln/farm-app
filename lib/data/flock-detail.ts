import "server-only";

import {
  ClipboardCheck,
  HeartPulse,
  PackagePlus,
  Scale,
  Skull,
  Syringe,
} from "lucide-react";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import type { TimelineEvent } from "@/components/ui/timeline";
import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  dailyRecords,
  eggCollections,
  flocks,
  healthEvents,
  houses,
  inventoryItems,
  mortalityRecords,
  products,
  users,
  vaccinations,
  weightRecords,
} from "@/lib/db/schema";

import {
  axis,
  count,
  daysBetween,
  decimal,
  display,
  FLOCK_STATUS,
  formatAge,
  formatDate,
  money,
  percent,
  relativeTime,
  shortName,
} from "./common";
import { isoDaysAgo } from "@/lib/date";

const isoDay = isoDaysAgo;

/**
 * Header figures for the flock board. Feed and weight come from the record
 * tables rather than being stored on the flock, so the strip always agrees
 * with the underlying entries.
 */
export async function getFlockDetail(code: string) {
  const [row] = await db
    .select({
      id: flocks.id,
      code: flocks.code,
      type: flocks.type,
      breed: flocks.breed,
      initialCount: flocks.initialCount,
      currentCount: flocks.currentCount,
      startedOn: flocks.startedOn,
      closedOn: flocks.closedOn,
      status: flocks.status,
      sourceHatchery: flocks.sourceHatchery,
      houseId: flocks.houseId,
      houseName: houses.name,
    })
    .from(flocks)
    .leftJoin(houses, eq(houses.id, flocks.houseId))
    .where(eq(flocks.code, code))
    .limit(1);

  if (!row) return null;

  const [[feed], [weight]] = await Promise.all([
    db
      .select({
        totalKg: sql<number>`coalesce(sum(${dailyRecords.feedKg}), 0)::double precision`,
      })
      .from(dailyRecords)
      .where(eq(dailyRecords.flockId, row.id)),
    db
      .select({
        avgWeightKg: weightRecords.avgWeightKg,
        standardWeightKg: weightRecords.standardWeightKg,
      })
      .from(weightRecords)
      .where(eq(weightRecords.flockId, row.id))
      .orderBy(desc(weightRecords.recordedOn))
      .limit(1),
  ]);

  const lost = Math.max(row.initialCount - row.currentCount, 0);
  const mortalityPct =
    row.initialCount > 0 ? (lost / row.initialCount) * 100 : 0;

  /*
   * Feed conversion is cumulative feed over live weight produced. Without a
   * weight sample there is no denominator, so the strip shows a dash rather
   * than a number nobody can trace back to a record.
   */
  const liveWeightKg = weight ? row.currentCount * weight.avgWeightKg : 0;
  const fcr = liveWeightKg > 0 ? feed.totalKg / liveWeightKg : null;

  const statusDisplay = display(FLOCK_STATUS, row.status);

  return {
    id: row.id,
    code: row.code,
    type: row.type,
    typeLabel: row.type === "layer" ? "Layer" : "Broiler",
    breed: row.breed,
    house: row.houseName ?? "Unassigned",
    houseId: row.houseId,
    sourceHatchery: row.sourceHatchery,
    started: formatDate(row.startedOn),
    startedOn: row.startedOn,
    closedOn: row.closedOn,
    age: formatAge(row.startedOn, row.type, row.closedOn),
    ageDays: daysBetween(row.startedOn),
    initial: count(row.initialCount),
    initialCount: row.initialCount,
    current: count(row.currentCount),
    currentCount: row.currentCount,
    lost,
    mortality: percent(mortalityPct),
    mortalityPct,
    weight: weight ? `${decimal(weight.avgWeightKg, 2)} kg` : "—",
    weightKg: weight?.avgWeightKg ?? null,
    standardWeightKg: weight?.standardWeightKg ?? null,
    feedKg: feed.totalKg,
    fcr: fcr === null ? "—" : decimal(fcr, 2),
    status: statusDisplay.label,
    statusTone: statusDisplay.tone,
  };
}

/** Sampled average against the breed standard, one bar pair per sample. */
export async function getFlockWeightGrowth(flockId: number) {
  const rows = await db
    .select({
      ageDays: weightRecords.ageDays,
      recordedOn: weightRecords.recordedOn,
      avgWeightKg: weightRecords.avgWeightKg,
      standardWeightKg: weightRecords.standardWeightKg,
    })
    .from(weightRecords)
    .where(eq(weightRecords.flockId, flockId))
    .orderBy(asc(weightRecords.recordedOn));

  const actual = rows.map((row) => row.avgWeightKg);
  const standard = rows.map((row) => row.standardWeightKg ?? 0);
  const { max, ticks } = axis(Math.max(...actual, ...standard, 1), 4, (value) =>
    value.toFixed(1),
  );

  const last = rows.at(-1);
  const variance =
    last && last.standardWeightKg
      ? last.avgWeightKg - last.standardWeightKg
      : null;

  return {
    labels: rows.map((row) =>
      row.ageDays ? `D${row.ageDays}` : formatDate(row.recordedOn).slice(0, 6),
    ),
    ticks,
    max,
    actual,
    standard,
    variance,
    varianceLabel:
      variance === null
        ? "No sample yet"
        : `${variance >= 0 ? "+" : ""}${variance.toFixed(2)} kg vs standard`,
  };
}

/** Closing bird count per day — the flock's depletion curve. */
export async function getFlockPopulation(flockId: number, days = 14) {
  const rows = await db
    .select({
      recordDate: dailyRecords.recordDate,
      closingBirds: dailyRecords.closingBirds,
    })
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.flockId, flockId),
        gte(dailyRecords.recordDate, isoDay(days - 1)),
      ),
    )
    .orderBy(asc(dailyRecords.recordDate));

  const values = rows.map((row) => row.closingBirds);
  if (values.length === 0) {
    return { labels: [], ticks: [], min: 0, max: 1, values: [], lost: 0 };
  }

  // A flock loses a fraction of a percent a day, so a zero-based axis would
  // render the curve as a flat line. The rail spans the depletion range only.
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const padding = Math.max(Math.round((highest - lowest) * 0.25), 10);
  const min = Math.max(lowest - padding, 0);
  const max = highest + padding;

  return {
    labels: rows.map((row) => row.recordDate.slice(8, 10)),
    ticks: Array.from({ length: 4 }, (_, index) =>
      count(max - ((max - min) / 3) * index),
    ),
    min,
    max,
    values,
    lost: highest - lowest,
  };
}

export async function getFlockFeedTrend(flockId: number, days = 14) {
  const rows = await db
    .select({
      recordDate: dailyRecords.recordDate,
      feedKg: dailyRecords.feedKg,
    })
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.flockId, flockId),
        gte(dailyRecords.recordDate, isoDay(days - 1)),
      ),
    )
    .orderBy(asc(dailyRecords.recordDate));

  const values = rows.map((row) => Math.round(row.feedKg ?? 0));
  const { max, ticks } = axis(Math.max(...values, 1));

  return {
    labels: rows.map((row) => row.recordDate.slice(8, 10)),
    ticks,
    max,
    values,
    cumulative: values.reduce((sum, value) => sum + value, 0),
  };
}

export async function getFlockMortalityTrend(flockId: number, days = 14) {
  const rows = await db
    .select({
      occurredOn: mortalityRecords.occurredOn,
      deaths: sql<number>`sum(${mortalityRecords.deaths})::int`,
    })
    .from(mortalityRecords)
    .where(
      and(
        eq(mortalityRecords.flockId, flockId),
        gte(mortalityRecords.occurredOn, isoDay(days - 1)),
      ),
    )
    .groupBy(mortalityRecords.occurredOn)
    .orderBy(asc(mortalityRecords.occurredOn));

  const values = rows.map((row) => row.deaths);
  const { max, ticks } = axis(Math.max(...values, 1));

  return {
    labels: rows.map((row) => row.occurredOn.slice(8, 10)),
    ticks,
    max,
    values,
    total: values.reduce((sum, value) => sum + value, 0),
  };
}

/**
 * The activity feed merges every table that records something against the
 * flock, newest first, and closes with the placement entry.
 */
export async function getFlockActivity(
  flockId: number,
  limit = 8,
): Promise<TimelineEvent[]> {
  const [flock] = await db
    .select({
      initialCount: flocks.initialCount,
      startedOn: flocks.startedOn,
      sourceHatchery: flocks.sourceHatchery,
    })
    .from(flocks)
    .where(eq(flocks.id, flockId))
    .limit(1);

  const [weights, records, shots, cases, deaths] = await Promise.all([
    db
      .select({
        recordedOn: weightRecords.recordedOn,
        avgWeightKg: weightRecords.avgWeightKg,
        sampleSize: weightRecords.sampleSize,
        uniformityPct: weightRecords.uniformityPct,
        createdAt: weightRecords.createdAt,
      })
      .from(weightRecords)
      .where(eq(weightRecords.flockId, flockId))
      .orderBy(desc(weightRecords.recordedOn))
      .limit(3),
    db
      .select({
        recordDate: dailyRecords.recordDate,
        feedKg: dailyRecords.feedKg,
        deaths: dailyRecords.deaths,
        waterLitres: dailyRecords.waterLitres,
        createdAt: dailyRecords.createdAt,
        recordedBy: users.name,
      })
      .from(dailyRecords)
      .leftJoin(users, eq(users.id, dailyRecords.recordedById))
      .where(eq(dailyRecords.flockId, flockId))
      .orderBy(desc(dailyRecords.recordDate))
      .limit(3),
    db
      .select({
        vaccine: vaccinations.vaccine,
        route: vaccinations.route,
        status: vaccinations.status,
        scheduledOn: vaccinations.scheduledOn,
        administeredAt: vaccinations.administeredAt,
        administeredBy: users.name,
      })
      .from(vaccinations)
      .leftJoin(users, eq(users.id, vaccinations.administeredById))
      .where(eq(vaccinations.flockId, flockId))
      .orderBy(desc(vaccinations.scheduledOn))
      .limit(3),
    db
      .select({
        occurredOn: healthEvents.occurredOn,
        condition: healthEvents.condition,
        cases: healthEvents.cases,
        treatment: healthEvents.treatment,
        reportedBy: users.name,
      })
      .from(healthEvents)
      .leftJoin(users, eq(users.id, healthEvents.reportedById))
      .where(eq(healthEvents.flockId, flockId))
      .orderBy(desc(healthEvents.occurredOn))
      .limit(3),
    db
      .select({
        occurredOn: mortalityRecords.occurredOn,
        deaths: mortalityRecords.deaths,
        cause: mortalityRecords.cause,
      })
      .from(mortalityRecords)
      .where(eq(mortalityRecords.flockId, flockId))
      .orderBy(desc(mortalityRecords.occurredOn))
      .limit(2),
  ]);

  type Entry = TimelineEvent & { at: Date };
  const dayOf = (value: string) => new Date(`${value}T12:00:00`);

  const entries: Entry[] = [
    ...weights.map((row) => ({
      at: dayOf(row.recordedOn),
      icon: Scale,
      tone: "success" as Tone,
      title: "Weight sampling recorded",
      time: relativeTime(dayOf(row.recordedOn)),
      description: `${count(row.sampleSize)}-bird sample averaged ${decimal(
        row.avgWeightKg,
        2,
      )} kg${row.uniformityPct ? `. Uniformity ${percent(row.uniformityPct, 0)}.` : "."}`,
    })),
    ...records.map((row) => ({
      at: dayOf(row.recordDate),
      icon: ClipboardCheck,
      tone: "violet" as Tone,
      title: "Daily record submitted",
      time: relativeTime(dayOf(row.recordDate)),
      description: `${count(row.feedKg ?? 0)} kg feed, ${count(row.deaths)} mortalities, water ${count(
        row.waterLitres ?? 0,
      )} L — ${shortName(row.recordedBy)}.`,
    })),
    ...shots.map((row) => ({
      at: row.administeredAt ?? dayOf(row.scheduledOn),
      icon: Syringe,
      tone: (row.status === "completed"
        ? "success"
        : row.status === "overdue"
          ? "error"
          : "info") as Tone,
      title:
        row.status === "completed"
          ? "Vaccination completed"
          : `Vaccination ${row.status}`,
      time: relativeTime(row.administeredAt ?? dayOf(row.scheduledOn)),
      description: `${row.vaccine} · ${row.route}${
        row.administeredBy ? ` by ${shortName(row.administeredBy)}` : ""
      }.`,
    })),
    ...cases.map((row) => ({
      at: dayOf(row.occurredOn),
      icon: HeartPulse,
      tone: "warning" as Tone,
      title: row.condition,
      time: relativeTime(dayOf(row.occurredOn)),
      description: `${count(row.cases)} birds affected. ${
        row.treatment ?? "Awaiting diagnosis"
      } — reported by ${shortName(row.reportedBy)}.`,
    })),
    ...deaths.map((row) => ({
      at: dayOf(row.occurredOn),
      icon: Skull,
      tone: "error" as Tone,
      title: "Mortality logged",
      time: relativeTime(dayOf(row.occurredOn)),
      description: `${count(row.deaths)} birds lost · ${row.cause}.`,
    })),
  ];

  if (flock) {
    entries.push({
      at: dayOf(flock.startedOn),
      icon: PackagePlus,
      tone: "violet",
      title: "Flock placed",
      time: formatDate(flock.startedOn),
      description: `${count(flock.initialCount)} day-old chicks received${
        flock.sourceHatchery ? ` from ${flock.sourceHatchery}` : ""
      }.`,
    });
  }

  return entries
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map(({ at: _at, ...event }) => event);
}

export type FinancialLine = {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "success" | "violet";
};

/**
 * Cycle economics assembled from the records that exist: feed issued against
 * the item's unit cost, placement against the day-old chick cost price, and
 * projected revenue from the current sale price of what the flock produces.
 * Labour and utilities are booked farm-wide, not per flock, so they are not
 * split in here.
 */
export async function getFlockFinancials(flockId: number) {
  const [flock] = await db
    .select({
      id: flocks.id,
      type: flocks.type,
      initialCount: flocks.initialCount,
      currentCount: flocks.currentCount,
      startedOn: flocks.startedOn,
    })
    .from(flocks)
    .where(eq(flocks.id, flockId))
    .limit(1);

  if (!flock) return { lines: [] as FinancialLine[], marginPct: 0 };

  const [[feedCost], [weight], [eggs], priceRows] = await Promise.all([
    /*
     * Each daily record names the feed item it drew from, so the cost is the
     * kilos issued at that item's unit cost. Records taken before an item was
     * linked fall back to the average feed price.
     */
    db
      .select({
        cents: sql<number>`coalesce(sum(${dailyRecords.feedKg} * coalesce(
          ${inventoryItems.unitCostCents},
          (select avg(unit_cost_cents) from inventory_items where category = 'feed')
        )), 0)::int`,
      })
      .from(dailyRecords)
      .leftJoin(inventoryItems, eq(inventoryItems.id, dailyRecords.feedItemId))
      .where(eq(dailyRecords.flockId, flock.id)),
    db
      .select({ avgWeightKg: weightRecords.avgWeightKg })
      .from(weightRecords)
      .where(eq(weightRecords.flockId, flock.id))
      .orderBy(desc(weightRecords.recordedOn))
      .limit(1),
    db
      .select({
        collected: sql<number>`coalesce(sum(${eggCollections.gradeA} + ${eggCollections.gradeB}), 0)::int`,
      })
      .from(eggCollections)
      .where(eq(eggCollections.flockId, flock.id)),
    db
      .select({
        name: products.name,
        priceCents: products.priceCents,
        costCents: products.costCents,
      })
      .from(products),
  ]);

  const priceOf = (name: string) =>
    priceRows.find((row) => row.name === name)?.priceCents ?? 0;
  const costOf = (name: string) =>
    priceRows.find((row) => row.name === name)?.costCents ?? 0;

  const chickCost = flock.initialCount * costOf("Day-old Chicks");
  const totalCost = feedCost.cents + chickCost;

  /*
   * Broilers are valued as live birds at their sampled weight against the
   * per-bird price; layers on the crates their collections have already
   * filled (30 eggs to a crate).
   */
  const revenue =
    flock.type === "layer"
      ? Math.round((eggs.collected / 30) * priceOf("Table Eggs"))
      : Math.round(flock.currentCount * priceOf("Live Birds"));

  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  const lines: FinancialLine[] = [
    { label: "Feed cost", value: money(feedCost.cents) },
    { label: "Day-old chicks", value: money(chickCost) },
    { label: "Total cost", value: money(totalCost), strong: true },
    {
      label: "Projected revenue",
      value: money(revenue),
      strong: true,
      tone: "success",
    },
    {
      label: "Projected profit",
      value: money(profit),
      strong: true,
      tone: "violet",
    },
  ];

  return { lines, marginPct, marginLabel: percent(marginPct) };
}
