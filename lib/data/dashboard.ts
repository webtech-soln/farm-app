import "server-only";

import {
  Banknote,
  Bird,
  Check,
  Egg,
  HeartPulse,
  Layers,
  PackageOpen,
  ReceiptCent,
  Syringe,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wallet,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { and, asc, eq, gte, lte, ne, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  dailyRecords,
  eggCollections,
  expenses,
  flocks,
  houses,
  inventoryItems,
  mortalityRecords,
  orderItems,
  orders,
  payments,
  products,
  tasks,
  users,
  vaccinations,
} from "@/lib/db/schema";

import {
  FLOCK_STATUS,
  TASK_PRIORITY,
  axis,
  changePct,
  compactTick,
  count,
  decimal,
  display,
  formatAge,
  formatTime,
  money,
  percent,
  recentDays,
  recentMonths,
  relativeTime,
  shortName,
  signedPercent,
} from "./common";
import { getFarmSettings } from "./settings";
import { isoDaysAgo, toIsoDate } from "@/lib/date";

export type Kpi = {
  label: string;
  icon: LucideIcon;
  iconTone?: Tone;
  value: string;
  delta: string;
  deltaIcon: LucideIcon;
  deltaTone: Tone;
  note: string;
};

const isoDay = isoDaysAgo;

function monthStart(offset: number) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - offset, 1);
}

export async function getDashboardKpis(): Promise<Kpi[]> {
  const settings = await getFarmSettings();
  const thisMonth = monthStart(0);
  const lastMonth = monthStart(1);

  const [birdTotals] = await db
    .select({
      birds: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
      placed: sql<number>`coalesce(sum(${flocks.initialCount}), 0)::int`,
      activeFlocks: sql<number>`count(*)::int`,
      housesInUse: sql<number>`count(distinct ${flocks.houseId})::int`,
    })
    .from(flocks)
    .where(ne(flocks.status, "closed"));

  const [houseCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(houses);

  // Mortality across the last 7 days versus the 7 before it.
  const [mortality] = await db
    .select({
      thisWeek: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} >= ${isoDay(6)}), 0)::int`,
      lastWeek: sql<number>`coalesce(sum(${mortalityRecords.deaths}) filter (where ${mortalityRecords.occurredOn} >= ${isoDay(13)} and ${mortalityRecords.occurredOn} < ${isoDay(6)}), 0)::int`,
    })
    .from(mortalityRecords);

  const flockBase = birdTotals.birds || 1;
  const mortalityThisWeekPct = (mortality.thisWeek / flockBase) * 100;
  const mortalityLastWeekPct = (mortality.lastWeek / flockBase) * 100;
  const mortalityDelta = mortalityThisWeekPct - mortalityLastWeekPct;

  const [eggs] = await db
    .select({
      today: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} = ${isoDay(0)}), 0)::int`,
      yesterday: sql<number>`coalesce(sum(${eggCollections.collected}) filter (where ${eggCollections.collectedOn} = ${isoDay(1)}), 0)::int`,
    })
    .from(eggCollections);

  const [feedStock] = await db
    .select({
      quantity: sql<number>`coalesce(sum(${inventoryItems.quantity}), 0)`,
      minimum: sql<number>`coalesce(sum(${inventoryItems.minStock}), 0)`,
    })
    .from(inventoryItems)
    .where(and(eq(inventoryItems.category, "feed"), eq(inventoryItems.isActive, true)));

  // Average daily feed burn over the last week gives the days-of-cover figure.
  const feedPerDay = await db
    .select({
      day: dailyRecords.recordDate,
      total: sql<number>`coalesce(sum(${dailyRecords.feedKg}), 0)::float`,
    })
    .from(dailyRecords)
    .where(gte(dailyRecords.recordDate, isoDay(6)))
    .groupBy(dailyRecords.recordDate);

  const perDay =
    feedPerDay.length > 0
      ? feedPerDay.reduce((sum, row) => sum + Number(row.total), 0) /
        feedPerDay.length
      : 0;
  const daysLeft = perDay > 0 ? Math.floor(feedStock.quantity / perDay) : null;
  const feedLow = feedStock.quantity <= settings.feedMinimumStockKg * 4;

  const [revenue] = await db
    .select({
      thisMonth: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.receivedOn} >= ${toIsoDate(thisMonth)}), 0)::int`,
      lastMonth: sql<number>`coalesce(sum(${payments.amountCents}) filter (where ${payments.receivedOn} >= ${toIsoDate(lastMonth)} and ${payments.receivedOn} < ${toIsoDate(thisMonth)}), 0)::int`,
    })
    .from(payments);

  const [spend] = await db
    .select({
      thisMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= ${toIsoDate(thisMonth)}), 0)::int`,
      lastMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= ${toIsoDate(lastMonth)} and ${expenses.expenseDate} < ${toIsoDate(thisMonth)}), 0)::int`,
    })
    .from(expenses);

  const profitThisMonth = revenue.thisMonth - spend.thisMonth;
  const profitLastMonth = revenue.lastMonth - spend.lastMonth;

  // Compare against the closing balance a week ago rather than against
  // placement, so the delta reflects movement instead of lifetime attrition.
  const [birdsLastWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(${dailyRecords.closingBirds}), 0)::int`,
    })
    .from(dailyRecords)
    .where(eq(dailyRecords.recordDate, isoDay(7)));

  const birdsDelta = changePct(
    birdTotals.birds,
    birdsLastWeek.total || birdTotals.birds,
  );
  const eggsDelta = changePct(eggs.today, eggs.yesterday);
  const revenueDelta = changePct(revenue.thisMonth, revenue.lastMonth);
  const expenseDelta = changePct(spend.thisMonth, spend.lastMonth);
  const profitDelta = changePct(profitThisMonth, profitLastMonth);

  return [
    {
      label: "Total Birds",
      icon: Bird,
      value: count(birdTotals.birds),
      delta: signedPercent(birdsDelta),
      deltaIcon: birdsDelta >= 0 ? TrendingUp : TrendingDown,
      deltaTone: birdsDelta >= 0 ? "success" : "warning",
      note: "vs last week",
    },
    {
      label: "Active Flocks",
      icon: Layers,
      value: count(birdTotals.activeFlocks),
      delta: `${birdTotals.housesInUse} houses`,
      deltaIcon: Check,
      deltaTone: "neutral",
      note: `${houseCount.total} houses on farm`,
    },
    {
      label: "Mortality Rate",
      icon: HeartPulse,
      value: percent(mortalityThisWeekPct),
      delta: `${mortalityDelta <= 0 ? "↓" : "↑"} ${Math.abs(mortalityDelta).toFixed(1)}%`,
      deltaIcon: mortalityDelta <= 0 ? TrendingDown : TrendingUp,
      deltaTone: mortalityDelta <= 0 ? "success" : "error",
      note: "from last week",
    },
    {
      label: "Eggs Today",
      icon: Egg,
      value: count(eggs.today),
      delta: signedPercent(eggsDelta),
      deltaIcon: eggsDelta >= 0 ? TrendingUp : TrendingDown,
      deltaTone: eggsDelta >= 0 ? "success" : "warning",
      note: "vs yesterday",
    },
    {
      label: "Feed Stock",
      icon: Wheat,
      iconTone: feedLow ? "warning" : undefined,
      value: `${decimal(feedStock.quantity / 1000, 1)} tons`,
      delta: feedLow ? "Low stock" : "Healthy",
      deltaIcon: feedLow ? TriangleAlert : Check,
      deltaTone: feedLow ? "warning" : "success",
      note: daysLeft === null ? "no recent usage" : `≈ ${daysLeft} days left`,
    },
    {
      label: "Revenue",
      icon: Banknote,
      value: money(revenue.thisMonth),
      delta: signedPercent(revenueDelta),
      deltaIcon: revenueDelta >= 0 ? TrendingUp : TrendingDown,
      deltaTone: revenueDelta >= 0 ? "success" : "error",
      note: "this month",
    },
    {
      label: "Expenses",
      icon: ReceiptCent,
      value: money(spend.thisMonth),
      delta: signedPercent(expenseDelta),
      deltaIcon: expenseDelta >= 0 ? TrendingUp : TrendingDown,
      deltaTone: expenseDelta > 0 ? "error" : "success",
      note: "this month",
    },
    {
      label: "Net Profit",
      icon: Wallet,
      value: money(profitThisMonth),
      delta: signedPercent(profitDelta),
      deltaIcon: profitDelta >= 0 ? TrendingUp : TrendingDown,
      deltaTone: profitDelta >= 0 ? "success" : "error",
      note: "this month",
    },
  ];
}

/** Eggs collected against eggs sold, over the last seven days. */
export async function getProductionChart() {
  const days = recentDays(7);
  const from = days[0].key;

  const collected = await db
    .select({
      day: eggCollections.collectedOn,
      total: sql<number>`sum(${eggCollections.collected})::int`,
    })
    .from(eggCollections)
    .where(gte(eggCollections.collectedOn, from))
    .groupBy(eggCollections.collectedOn);

  // Egg products are sold by the crate; a crate holds 30 eggs.
  const sold = await db
    .select({
      day: sql<string>`to_char(${orders.placedAt}, 'YYYY-MM-DD')`,
      total: sql<number>`coalesce(sum(${orderItems.quantity} * 30), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .innerJoin(products, eq(products.id, orderItems.productId))
    .where(
      and(
        gte(orders.placedAt, new Date(`${from}T00:00:00`)),
        eq(products.category, "Eggs"),
        ne(orders.status, "cancelled"),
      ),
    )
    .groupBy(sql`to_char(${orders.placedAt}, 'YYYY-MM-DD')`);

  const collectedByDay = new Map(collected.map((row) => [row.day, row.total]));
  const soldByDay = new Map(sold.map((row) => [row.day, row.total]));

  const produced = days.map((day) => collectedByDay.get(day.key) ?? 0);
  const soldSeries = days.map((day) => soldByDay.get(day.key) ?? 0);
  const { max, ticks } = axis(Math.max(...produced, ...soldSeries, 1), 5, compactTick);

  return { labels: days.map((day) => day.label), ticks, max, produced, sold: soldSeries };
}

/** Revenue, expenses and profit by month for the last six months. */
export async function getFinanceChart(months = 6) {
  const range = recentMonths(months);
  const from = toIsoDate(range[0].start);

  const [revenueRows, expenseRows] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${payments.receivedOn}, 'YYYY-MM')`,
        total: sql<number>`sum(${payments.amountCents})::int`,
      })
      .from(payments)
      .where(gte(payments.receivedOn, from))
      .groupBy(sql`to_char(${payments.receivedOn}, 'YYYY-MM')`),
    db
      .select({
        month: sql<string>`to_char(${expenses.expenseDate}, 'YYYY-MM')`,
        total: sql<number>`sum(${expenses.amountCents})::int`,
      })
      .from(expenses)
      .where(gte(expenses.expenseDate, from))
      .groupBy(sql`to_char(${expenses.expenseDate}, 'YYYY-MM')`),
  ]);

  const revenueByMonth = new Map(revenueRows.map((row) => [row.month, row.total]));
  const expenseByMonth = new Map(expenseRows.map((row) => [row.month, row.total]));

  const revenue = range.map((month) => (revenueByMonth.get(month.key) ?? 0) / 100);
  const expensesSeries = range.map((month) => (expenseByMonth.get(month.key) ?? 0) / 100);
  const profit = revenue.map((value, index) => value - expensesSeries[index]);

  const { max, ticks } = axis(
    Math.max(...revenue, ...expensesSeries, 1),
    4,
    compactTick,
  );

  return {
    labels: range.map((month) => month.label),
    ticks,
    max,
    revenue,
    expenses: expensesSeries,
    profit,
  };
}

export type FlockRow = {
  id: string;
  breed: string;
  house: string;
  birds: string;
  age: string;
  mortality: string;
  weight: string;
  status: string;
  statusTone: Tone;
};

export async function getFlockPerformance(limit = 5): Promise<FlockRow[]> {
  const rows = await db
    .select({
      code: flocks.code,
      breed: flocks.breed,
      type: flocks.type,
      initialCount: flocks.initialCount,
      currentCount: flocks.currentCount,
      startedOn: flocks.startedOn,
      status: flocks.status,
      houseName: houses.name,
      // `flocks.id` is spelled out because an interpolated column reference
      // renders unqualified and would bind inside the subquery.
      weight: sql<number | null>`(
        select avg_weight_kg from weight_records
        where weight_records.flock_id = flocks.id
        order by recorded_on desc limit 1
      )`,
    })
    .from(flocks)
    .leftJoin(houses, eq(houses.id, flocks.houseId))
    .where(ne(flocks.status, "closed"))
    .orderBy(asc(flocks.code))
    .limit(limit);

  return rows.map((row) => {
    const statusDisplay = display(FLOCK_STATUS, row.status);
    const mortality =
      row.initialCount > 0
        ? ((row.initialCount - row.currentCount) / row.initialCount) * 100
        : 0;

    return {
      id: row.code,
      breed: `${row.breed} · ${row.type === "broiler" ? "Broiler" : "Layer"}`,
      house: row.houseName ?? "—",
      birds: count(row.currentCount),
      age: formatAge(row.startedOn, row.type),
      mortality: percent(mortality),
      weight:
        row.type === "layer" || row.weight === null
          ? "—"
          : `${decimal(row.weight, 2)} kg`,
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
    };
  });
}

export async function getHouseOccupancy() {
  const rows = await db
    .select({
      name: houses.name,
      capacity: houses.capacity,
      current: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
    })
    .from(houses)
    .leftJoin(flocks, and(eq(flocks.houseId, houses.id), ne(flocks.status, "closed")))
    .groupBy(houses.id)
    .orderBy(houses.code);

  return rows.map((row) => ({
    house: row.name,
    current: row.current,
    capacity: row.capacity,
    tone:
      row.capacity > 0 && row.current / row.capacity >= 0.98
        ? ("warning" as const)
        : ("violet" as const),
  }));
}

export type AttentionAlert = {
  /**
   * Stable identity for the list. Several rows can raise the same kind of
   * alert, so the title alone does not identify one.
   */
  id: string;
  icon: LucideIcon;
  tone: Tone;
  title: string;
  time: string;
  description: string;
  action: string;
  href: string;
};

/**
 * Derived rather than stored: the alerts strip reflects live thresholds, so a
 * resolved condition disappears on the next render.
 */
export async function getAttentionAlerts(): Promise<AttentionAlert[]> {
  const settings = await getFarmSettings();
  const alerts: AttentionAlert[] = [];

  const breaching = await db
    .select({
      code: flocks.code,
      initialCount: flocks.initialCount,
      currentCount: flocks.currentCount,
      updatedAt: flocks.updatedAt,
      houseName: houses.name,
    })
    .from(flocks)
    .leftJoin(houses, eq(houses.id, flocks.houseId))
    .where(
      and(
        ne(flocks.status, "closed"),
        sql`(${flocks.initialCount} - ${flocks.currentCount})::float / nullif(${flocks.initialCount}, 0) * 100 >= ${settings.weeklyMortalityAlertPct}`,
      ),
    )
    .limit(2);

  for (const flock of breaching) {
    const pct =
      ((flock.initialCount - flock.currentCount) / flock.initialCount) * 100;
    alerts.push({
      id: `mortality-${flock.code}`,
      icon: TriangleAlert,
      tone: "error",
      title: "High Mortality",
      time: relativeTime(flock.updatedAt),
      description: `Flock ${flock.code} mortality reached ${pct.toFixed(1)}%, above the ${settings.weeklyMortalityAlertPct}% threshold.`,
      action: "Investigate",
      href: `/flocks/${flock.code}`,
    });
  }

  const lowStock = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      category: inventoryItems.category,
      quantity: inventoryItems.quantity,
      minStock: inventoryItems.minStock,
      unit: inventoryItems.unit,
      updatedAt: inventoryItems.updatedAt,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.isActive, true),
        sql`${inventoryItems.quantity} <= ${inventoryItems.minStock}`,
      ),
    )
    .orderBy(asc(sql`${inventoryItems.quantity} - ${inventoryItems.minStock}`))
    .limit(2);

  for (const item of lowStock) {
    alerts.push({
      id: `stock-${item.id}`,
      icon: PackageOpen,
      tone: "warning",
      // The same check covers medicine and consumables, so only feed is
      // announced as feed.
      title: item.category === "feed" ? "Low Feed Stock" : "Low Stock",
      time: relativeTime(item.updatedAt),
      description: `${item.name} is at ${count(item.quantity)} ${item.unit} against a ${count(item.minStock)} ${item.unit} minimum.`,
      action: "Reorder",
      // Lands on the item itself rather than the whole register.
      href: `/inventory?q=${encodeURIComponent(item.name)}`,
    });
  }

  const dueVaccinations = await db
    .select({
      id: vaccinations.id,
      vaccine: vaccinations.vaccine,
      scheduledOn: vaccinations.scheduledOn,
      flockCode: flocks.code,
      createdAt: vaccinations.createdAt,
    })
    .from(vaccinations)
    .leftJoin(flocks, eq(flocks.id, vaccinations.flockId))
    .where(
      and(
        sql`${vaccinations.status} in ('scheduled', 'overdue')`,
        lte(vaccinations.scheduledOn, isoDay(-2)),
      ),
    )
    .orderBy(asc(vaccinations.scheduledOn))
    .limit(2);

  for (const vaccination of dueVaccinations) {
    alerts.push({
      id: `vaccination-${vaccination.id}`,
      icon: Syringe,
      tone: "info",
      title: "Vaccination Due",
      time: relativeTime(vaccination.createdAt),
      description: `${vaccination.flockCode ?? "All flocks"} ${vaccination.vaccine} scheduled for ${vaccination.scheduledOn}.`,
      action: "Schedule",
      href: `/vaccinations?q=${encodeURIComponent(vaccination.vaccine)}`,
    });
  }

  return alerts.slice(0, 4);
}

export async function getTodaysTasks() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const rows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      priority: tasks.priority,
      status: tasks.status,
      dueAt: tasks.dueAt,
      assignee: users.name,
    })
    .from(tasks)
    .leftJoin(users, eq(users.id, tasks.assigneeId))
    .where(and(gte(tasks.dueAt, startOfDay), lte(tasks.dueAt, endOfDay)))
    .orderBy(asc(tasks.dueAt))
    .limit(6);

  return rows.map((row) => {
    const priority = display(TASK_PRIORITY, row.priority);
    return {
      id: row.id,
      title: row.title,
      meta: `${shortName(row.assignee)} · ${formatTime(row.dueAt)}`,
      priority: priority.label,
      tone: priority.tone,
      done: row.status === "completed",
    };
  });
}

export async function getGreetingContext() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return {
    greeting,
    today: new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
  };
}
