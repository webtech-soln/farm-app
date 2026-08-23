import "server-only";

import { and, asc, eq, gte, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  dailyRecords,
  expenses,
  flocks,
  houses,
  inventoryItems,
  suppliers,
} from "@/lib/db/schema";

import {
  axis,
  count,
  decimal,
  DONUT_COLORS,
  money,
  recentDays,
} from "./common";
import { getFarmSettings } from "./settings";

const IS_FEED = and(
  eq(inventoryItems.category, "feed"),
  eq(inventoryItems.isActive, true),
);

/** Daily consumption in tonnes, split by the flock type it was fed to. */
export async function getFeedTrend(days = 14) {
  const range = recentDays(days, "dayOfMonth");

  const rows = await db
    .select({
      day: dailyRecords.recordDate,
      type: flocks.type,
      total: sql<number>`coalesce(sum(${dailyRecords.feedKg}), 0)::double precision`,
    })
    .from(dailyRecords)
    .innerJoin(flocks, eq(flocks.id, dailyRecords.flockId))
    .where(gte(dailyRecords.recordDate, range[0].key))
    .groupBy(dailyRecords.recordDate, flocks.type)
    .orderBy(asc(dailyRecords.recordDate));

  const byKey = new Map(rows.map((row) => [`${row.day}:${row.type}`, row.total]));
  const tonnes = (day: string, type: string) =>
    Number((((byKey.get(`${day}:${type}`) ?? 0) as number) / 1000).toFixed(2));

  const broiler = range.map((entry) => tonnes(entry.key, "broiler"));
  const layer = range.map((entry) => tonnes(entry.key, "layer"));
  const { max, ticks } = axis(
    Math.max(...broiler, ...layer, 1),
    4,
    (value) => `${value.toFixed(1)}t`,
  );

  return { labels: range.map((entry) => entry.label), ticks, max, broiler, layer };
}

/** Feed on hand per item, in tonnes. */
export async function getStockByType() {
  const rows = await db
    .select({
      name: inventoryItems.name,
      quantity: inventoryItems.quantity,
    })
    .from(inventoryItems)
    .where(IS_FEED)
    .orderBy(sql`${inventoryItems.quantity} desc`)
    .limit(6);

  return rows.map((row, index) => {
    const tonnes = row.quantity / 1000;
    return {
      name: row.name,
      value: Number(tonnes.toFixed(2)),
      color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
      display: `${decimal(tonnes, 1)} t`,
    };
  });
}

export type FeedItemRow = {
  id: number;
  name: string;
  batch: string;
  type: string;
  quantity: string;
  /** The board tints quantities that sit at or under the minimum. */
  quantityTone?: Tone;
  unitCost: string;
  totalValue: string;
  minStock: string;
  status: string;
  statusTone: Tone;
};

export type FeedFilters = {
  search?: string;
  supplier?: string;
};

export async function getFeedInventory(
  filters: FeedFilters = {},
): Promise<FeedItemRow[]> {
  const conditions = [IS_FEED];

  if (filters.supplier) conditions.push(eq(suppliers.name, filters.supplier));
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${inventoryItems.name}) like ${term} or lower(coalesce(${inventoryItems.batch}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      subcategory: inventoryItems.subcategory,
      batch: inventoryItems.batch,
      quantity: inventoryItems.quantity,
      unit: inventoryItems.unit,
      unitCostCents: inventoryItems.unitCostCents,
      minStock: inventoryItems.minStock,
      supplierName: suppliers.name,
    })
    .from(inventoryItems)
    .leftJoin(suppliers, eq(suppliers.id, inventoryItems.supplierId))
    .where(and(...conditions))
    .orderBy(sql`${inventoryItems.quantity} desc`);

  return rows.map((row) => {
    const belowMinimum = row.quantity < row.minStock;
    const nearMinimum = !belowMinimum && row.quantity <= row.minStock * 1.1;

    return {
      id: row.id,
      name: row.name,
      batch: [row.batch ? `Batch ${row.batch}` : null, row.supplierName]
        .filter(Boolean)
        .join(" · "),
      type: row.subcategory ?? "—",
      quantity: `${count(row.quantity)} ${row.unit}`,
      quantityTone: belowMinimum ? "error" : nearMinimum ? "warning" : undefined,
      unitCost: money(row.unitCostCents),
      totalValue: money(Math.round(row.quantity * row.unitCostCents)),
      minStock: `${count(row.minStock)} ${row.unit}`,
      status: belowMinimum
        ? "Below minimum"
        : nearMinimum
          ? "Reorder soon"
          : "In stock",
      statusTone: belowMinimum ? "error" : nearMinimum ? "warning" : "success",
    };
  });
}

export async function getFeedKpis() {
  const settings = await getFarmSettings();

  const [[stock], [consumption], [cost], [houseCount]] = await Promise.all([
    db
      .select({
        totalKg: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)::double precision`,
        valueCents: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitCostCents}), 0)::bigint`,
        items: sql<number>`count(*)::int`,
        belowMinimum: sql<number>`count(*) filter (where ${inventoryItems.quantity} < ${inventoryItems.minStock})::int`,
      })
      .from(inventoryItems)
      .where(IS_FEED),
    db
      .select({
        today: sql<number>`coalesce(sum(${dailyRecords.feedKg}) filter (where ${dailyRecords.recordDate} = current_date), 0)::double precision`,
        yesterday: sql<number>`coalesce(sum(${dailyRecords.feedKg}) filter (where ${dailyRecords.recordDate} = current_date - 1), 0)::double precision`,
        week: sql<number>`coalesce(sum(${dailyRecords.feedKg}) filter (where ${dailyRecords.recordDate} >= current_date - 6), 0)::double precision`,
        previousWeek: sql<number>`coalesce(sum(${dailyRecords.feedKg}) filter (where ${dailyRecords.recordDate} >= current_date - 13 and ${dailyRecords.recordDate} < current_date - 6), 0)::double precision`,
      })
      .from(dailyRecords),
    db
      .select({
        feedThisMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.category} = 'feed' and ${expenses.expenseDate} >= date_trunc('month', current_date)), 0)::bigint`,
        allThisMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= date_trunc('month', current_date)), 0)::bigint`,
      })
      .from(expenses),
    db
      .select({ total: sql<number>`count(distinct ${dailyRecords.houseId})::int` })
      .from(dailyRecords)
      .where(sql`${dailyRecords.recordDate} = current_date`),
  ]);

  const feedCost = Number(cost.feedThisMonth);
  const allCost = Number(cost.allThisMonth);
  const weekChangePct =
    consumption.previousWeek > 0
      ? ((consumption.week - consumption.previousWeek) / consumption.previousWeek) *
        100
      : 0;

  return {
    stockKg: stock.totalKg,
    stockTonnes: stock.totalKg / 1000,
    stockLabel: `${decimal(stock.totalKg / 1000, 1)} tons`,
    stockValue: Number(stock.valueCents),
    stockValueLabel: money(Number(stock.valueCents)),
    items: stock.items,
    belowMinimum: stock.belowMinimum,
    lowStock: stock.totalKg < settings.feedMinimumStockKg,
    todayKg: consumption.today,
    todayLabel: `${decimal(consumption.today / 1000, 1)} tons`,
    todayChangeKg: Math.round(consumption.today - consumption.yesterday),
    weekKg: consumption.week,
    weekLabel: `${decimal(consumption.week / 1000, 1)} tons`,
    weekChangePct,
    housesFed: houseCount.total,
    feedCost,
    feedCostLabel: money(feedCost),
    feedCostShare: allCost > 0 ? (feedCost / allCost) * 100 : 0,
  };
}

/** Feed items for the daily-record picker. */
export async function getFeedOptions() {
  return db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      batch: inventoryItems.batch,
      quantity: inventoryItems.quantity,
      unit: inventoryItems.unit,
    })
    .from(inventoryItems)
    .where(IS_FEED)
    .orderBy(inventoryItems.name);
}

/** Today's issue per house, for the feed board's house strip. */
export async function getFeedByHouse() {
  const rows = await db
    .select({
      houseName: houses.name,
      feedKg: sql<number>`coalesce(sum(${dailyRecords.feedKg}), 0)::double precision`,
    })
    .from(dailyRecords)
    .innerJoin(houses, eq(houses.id, dailyRecords.houseId))
    .where(sql`${dailyRecords.recordDate} = current_date`)
    .groupBy(houses.name)
    .orderBy(houses.name);

  return rows.map((row) => ({
    house: row.houseName,
    feedKg: row.feedKg,
    label: `${count(row.feedKg)} kg`,
  }));
}
