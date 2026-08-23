import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  eggCollections,
  flocks,
  houses,
  orderItems,
  orders,
  products,
  users,
} from "@/lib/db/schema";

import {
  COLLECTION_STATUS,
  DONUT_COLORS,
  axis,
  compactTick,
  count,
  display,
  formatTime,
  humanise,
  percent,
  recentDays,
} from "./common";
import { getFarmSettings } from "./settings";
import { isoDaysAgo } from "@/lib/date";

export type Collection = {
  id: number;
  time: string;
  session: string;
  house: string;
  flock: string;
  collected: string;
  broken: string;
  rate: string;
  rateTone: Tone | "ink";
  recordedBy: string;
  status: string;
  statusTone: Tone;
};

const isoDay = isoDaysAgo;

/** Eggs collected against eggs sold over the last 14 days. */
export async function getEggTrend(days = 14) {
  const range = recentDays(days, "dayOfMonth");

  const [collectedRows, soldRows] = await Promise.all([
    db
      .select({
        day: eggCollections.collectedOn,
        total: sql<number>`sum(${eggCollections.collected})::int`,
      })
      .from(eggCollections)
      .where(gte(eggCollections.collectedOn, range[0].key))
      .groupBy(eggCollections.collectedOn),
    db
      .select({
        day: sql<string>`to_char(${orders.placedAt}, 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${orderItems.quantity} * 30), 0)::int`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .where(
        and(
          gte(orders.placedAt, new Date(`${range[0].key}T00:00:00`)),
          eq(products.category, "Eggs"),
          sql`${orders.status} <> 'cancelled'`,
        ),
      )
      .groupBy(sql`to_char(${orders.placedAt}, 'YYYY-MM-DD')`),
  ]);

  const collectedByDay = new Map(collectedRows.map((row) => [row.day, row.total]));
  const soldByDay = new Map(soldRows.map((row) => [row.day, row.total]));

  const collected = range.map((entry) => collectedByDay.get(entry.key) ?? 0);
  const sold = range.map((entry) => soldByDay.get(entry.key) ?? 0);
  const { max, ticks } = axis(Math.max(...collected, ...sold, 1), 4, compactTick);

  return { labels: range.map((entry) => entry.label), ticks, max, collected, sold };
}

export async function getGradeDistribution(days = 30) {
  const [row] = await db
    .select({
      gradeA: sql<number>`coalesce(sum(${eggCollections.gradeA}), 0)::int`,
      gradeB: sql<number>`coalesce(sum(${eggCollections.gradeB}), 0)::int`,
      rejected: sql<number>`coalesce(sum(${eggCollections.rejected}), 0)::int`,
    })
    .from(eggCollections)
    .where(gte(eggCollections.collectedOn, isoDay(days)));

  return [
    { name: "Grade A", value: row.gradeA, color: DONUT_COLORS[0], display: count(row.gradeA) },
    { name: "Grade B", value: row.gradeB, color: DONUT_COLORS[2], display: count(row.gradeB) },
    { name: "Rejected", value: row.rejected, color: "#E4E4E7", display: count(row.rejected) },
  ];
}

export async function getSizeBreakdown(days = 1) {
  const [row] = await db
    .select({
      small: sql<number>`coalesce(sum(${eggCollections.sizeSmall}), 0)::int`,
      medium: sql<number>`coalesce(sum(${eggCollections.sizeMedium}), 0)::int`,
      large: sql<number>`coalesce(sum(${eggCollections.sizeLarge}), 0)::int`,
      extraLarge: sql<number>`coalesce(sum(${eggCollections.sizeExtraLarge}), 0)::int`,
      gradeA: sql<number>`coalesce(sum(${eggCollections.gradeA}), 0)::int`,
      gradeB: sql<number>`coalesce(sum(${eggCollections.gradeB}), 0)::int`,
      collected: sql<number>`coalesce(sum(${eggCollections.collected}), 0)::int`,
    })
    .from(eggCollections)
    .where(gte(eggCollections.collectedOn, isoDay(days - 1)));

  const total = row.collected || 1;
  const share = (value: number) => `${Math.round((value / total) * 100)}% of intake`;

  return [
    { label: "Small", value: count(row.small), note: share(row.small) },
    { label: "Medium", value: count(row.medium), note: share(row.medium) },
    { label: "Large", value: count(row.large), note: share(row.large) },
    { label: "Extra Large", value: count(row.extraLarge), note: share(row.extraLarge) },
    {
      label: "Grade A",
      value: count(row.gradeA),
      note: "Premium price",
      chip: `${Math.round((row.gradeA / total) * 100)}%`,
      chipAccent: true,
    },
    {
      label: "Grade B",
      value: count(row.gradeB),
      note: "Standard price",
      chip: `${Math.round((row.gradeB / total) * 100)}%`,
    },
  ];
}

export type CollectionFilters = {
  search?: string;
  house?: string;
  session?: string;
  status?: string;
  date?: string;
};

export async function getCollections(
  filters: CollectionFilters = {},
  limit = 50,
  offset = 0,
): Promise<Collection[]> {
  const conditions = [
    eq(eggCollections.collectedOn, filters.date ?? isoDay(0)),
  ];

  if (filters.house) conditions.push(eq(houses.code, filters.house));
  if (filters.session) {
    conditions.push(sql`${eggCollections.session}::text = ${filters.session}`);
  }
  if (filters.status) {
    conditions.push(sql`${eggCollections.status}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${houses.name}) like ${term} or lower(coalesce(${flocks.code}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: eggCollections.id,
      collectedAt: eggCollections.collectedAt,
      session: eggCollections.session,
      collected: eggCollections.collected,
      broken: eggCollections.broken,
      status: eggCollections.status,
      houseName: houses.name,
      flockCode: flocks.code,
      flockBirds: flocks.currentCount,
      recordedBy: users.name,
    })
    .from(eggCollections)
    .innerJoin(houses, eq(houses.id, eggCollections.houseId))
    .leftJoin(flocks, eq(flocks.id, eggCollections.flockId))
    .leftJoin(users, eq(users.id, eggCollections.recordedById))
    .where(and(...conditions))
    .orderBy(eggCollections.collectedAt, houses.code)
    .limit(limit)
    .offset(offset);

  const settings = await getFarmSettings();

  return rows.map((row) => {
    // Hen-day rate: eggs per bird in the flock, for that collection.
    const rate = row.flockBirds && row.flockBirds > 0
      ? (row.collected / row.flockBirds) * 100
      : 0;

    const statusDisplay = display(COLLECTION_STATUS, row.status);
    const rateTone: Tone | "ink" =
      rate > 100 ? "warning" : rate >= settings.minProductionRatePct ? "success" : "ink";

    return {
      id: row.id,
      time: formatTime(row.collectedAt),
      session: `${humanise(row.session)} collection`,
      house: row.houseName,
      flock: row.flockCode ?? "—",
      collected: count(row.collected),
      broken: count(row.broken),
      rate: percent(rate),
      rateTone,
      recordedBy: row.recordedBy ?? "System",
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
    };
  });
}

export async function getEggKpis() {
  const settings = await getFarmSettings();

  const [totals] = await db
    .select({
      today: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} = ${isoDay(0)}), 0)::int`,
      yesterday: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} = ${isoDay(1)}), 0)::int`,
      week: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} >= ${isoDay(6)}), 0)::int`,
      previousWeek: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} >= ${isoDay(13)} and ${eggCollections.collectedOn} < ${isoDay(6)}), 0)::int`,
      brokenToday: sql<number>`coalesce(sum(${eggCollections.broken}) filter (where ${eggCollections.collectedOn} = ${isoDay(0)}), 0)::int`,
      brokenYesterday: sql<number>`coalesce(sum(${eggCollections.broken}) filter (where ${eggCollections.collectedOn} = ${isoDay(1)}), 0)::int`,
      gradeAToday: sql<number>`coalesce(sum(${eggCollections.gradeA}) filter (where ${eggCollections.collectedOn} = ${isoDay(0)}), 0)::int`,
      rejectedToday: sql<number>`coalesce(sum(${eggCollections.rejected}) filter (where ${eggCollections.collectedOn} = ${isoDay(0)}), 0)::int`,
    })
    .from(eggCollections);

  const [layerBirds] = await db
    .select({
      total: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
    })
    .from(flocks)
    .where(and(eq(flocks.type, "layer"), sql`${flocks.status} <> 'closed'`));

  const henDayRate =
    layerBirds.total > 0 ? (totals.today / layerBirds.total) * 100 : 0;

  // Wastage counts anything that cannot be sold: shells broken in the crate
  // plus eggs the grader rejected.
  const wastedToday = totals.brokenToday + totals.rejectedToday;

  return {
    today: totals.today,
    yesterday: totals.yesterday,
    week: totals.week,
    previousWeek: totals.previousWeek,
    brokenToday: totals.brokenToday,
    brokenYesterday: totals.brokenYesterday,
    breakageRate: totals.today > 0 ? (totals.brokenToday / totals.today) * 100 : 0,
    wastageRate: totals.today > 0 ? (wastedToday / totals.today) * 100 : 0,
    gradeAShare: totals.today > 0 ? (totals.gradeAToday / totals.today) * 100 : 0,
    henDayRate,
    belowTarget: henDayRate < settings.minProductionRatePct,
    layerBirds: layerBirds.total,
  };
}

/** Layer houses only — the collection modal should not offer broiler houses. */
export async function getLayerHouseOptions() {
  return db
    .selectDistinct({
      id: houses.id,
      code: houses.code,
      name: houses.name,
    })
    .from(houses)
    .innerJoin(flocks, eq(flocks.houseId, houses.id))
    .where(and(eq(flocks.type, "layer"), sql`${flocks.status} <> 'closed'`))
    .orderBy(houses.code);
}
