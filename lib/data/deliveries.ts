import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { customers, deliveries as table, orders, users } from "@/lib/db/schema";

import {
  axis,
  decimal,
  DELIVERY_STATUS,
  display,
  formatTime,
  initialsFor,
  recentDays,
} from "./common";

/** Scheduled versus completed runs per day, for the week chart. */
export async function getDeliveriesPerDay(days = 7) {
  const range = recentDays(days, "weekday");

  const rows = await db
    .select({
      day: table.scheduledOn,
      scheduled: sql<number>`count(*)::int`,
      completed: sql<number>`count(*) filter (where ${table.status} = 'delivered')::int`,
    })
    .from(table)
    .where(sql`${table.scheduledOn} >= ${range[0].key}`)
    .groupBy(table.scheduledOn);

  const byDay = new Map(rows.map((row) => [row.day, row]));
  const scheduled = range.map((entry) => byDay.get(entry.key)?.scheduled ?? 0);
  const completed = range.map((entry) => byDay.get(entry.key)?.completed ?? 0);
  const { max, ticks } = axis(Math.max(...scheduled, ...completed, 1));

  return { labels: range.map((entry) => entry.label), ticks, max, completed, scheduled };
}

export type DriverRow = {
  id: number;
  initials: string;
  name: string;
  route: string;
  status: string;
  statusTone: Tone;
  /** Share of today's stops already completed, 0–100. */
  progress: number;
};

/** Drivers with runs booked for today, and how far through them they are. */
export async function getDrivers(): Promise<DriverRow[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      stops: sql<number>`count(*)::int`,
      done: sql<number>`count(*) filter (where ${table.status} = 'delivered')::int`,
      failed: sql<number>`count(*) filter (where ${table.status} = 'failed')::int`,
      inTransit: sql<number>`count(*) filter (where ${table.status} = 'in_transit')::int`,
      route: sql<string | null>`max(${table.routeName})`,
    })
    .from(table)
    .innerJoin(users, eq(users.id, table.driverId))
    .where(sql`${table.scheduledOn} = current_date`)
    .groupBy(users.id, users.name)
    .orderBy(users.name);

  return rows.map((row) => {
    const settled = row.done + row.failed;
    const progress = row.stops > 0 ? Math.round((settled / row.stops) * 100) : 0;

    return {
      id: row.id,
      initials: initialsFor(row.name),
      name: row.name,
      route: `${row.stops} stop${row.stops === 1 ? "" : "s"}${
        row.route ? ` · ${row.route}` : ""
      }`,
      status:
        settled === row.stops
          ? "Completed"
          : row.inTransit > 0
            ? "On road"
            : "Scheduled",
      statusTone:
        settled === row.stops ? "success" : row.inTransit > 0 ? "info" : "neutral",
      progress,
    };
  });
}

export type DeliveryRow = {
  id: number;
  reference: string;
  load: string;
  customer: string;
  destination: string;
  driver: string;
  date: string;
  window: string;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
  /** Raw enum value, for the row actions. */
  statusKey: string;
};

export type DeliveryFilters = {
  search?: string;
  status?: string;
  driver?: string;
  date?: string;
};

export async function getDeliveries(
  filters: DeliveryFilters = {},
  limit = 50,
  offset = 0,
): Promise<DeliveryRow[]> {
  const conditions = [];

  if (filters.status) {
    conditions.push(sql`${table.status}::text = ${filters.status}`);
  }
  if (filters.driver) conditions.push(eq(users.name, filters.driver));
  // A `date` column will not accept an unparseable string as a parameter, so
  // the comparison is made in text — the column's own format is `YYYY-MM-DD`.
  if (filters.date) {
    conditions.push(sql`${table.scheduledOn}::text = ${filters.date}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${orders.reference}) like ${term} or lower(${customers.name}) like ${term} or lower(coalesce(${table.destination}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      reference: orders.reference,
      destination: table.destination,
      routeName: table.routeName,
      scheduledOn: table.scheduledOn,
      windowStart: table.windowStart,
      windowEnd: table.windowEnd,
      status: table.status,
      weightKg: table.weightKg,
      attempts: table.attempts,
      customerName: customers.name,
      driverName: users.name,
      items: sql<number>`(
        select count(*)::int from order_items where order_items.order_id = deliveries.order_id
      )`,
    })
    .from(table)
    .innerJoin(orders, eq(orders.id, table.orderId))
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .leftJoin(users, eq(users.id, table.driverId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(table.scheduledOn), asc(table.windowStart))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(DELIVERY_STATUS, row.status);
    const attempts = row.attempts ?? 0;

    return {
      id: row.id,
      reference: `#${row.reference}`,
      load: `${row.items} item${row.items === 1 ? "" : "s"}${
        row.weightKg ? ` · ${decimal(row.weightKg, 0)} kg` : ""
      }`,
      customer: row.customerName,
      destination: row.destination ?? "—",
      driver: row.driverName ?? "Unassigned",
      date: new Date(`${row.scheduledOn}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      // A failed run is more usefully described by its attempts than a window.
      window:
        row.status === "failed" && attempts > 0
          ? `Failed ${attempts} attempt${attempts === 1 ? "" : "s"}`
          : row.windowStart && row.windowEnd
            ? `${formatTime(row.windowStart)}–${formatTime(row.windowEnd)}`
            : "—",
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusKey: row.status,
      statusDot: row.status === "scheduled" ? false : undefined,
    };
  });
}

export async function getDeliveryKpis() {
  const [[runs], [pending]] = await Promise.all([
    db
      .select({
        today: sql<number>`count(*) filter (where ${table.scheduledOn} = current_date)::int`,
        completedToday: sql<number>`count(*) filter (where ${table.scheduledOn} = current_date and ${table.status} = 'delivered')::int`,
        inTransit: sql<number>`count(*) filter (where ${table.status} = 'in_transit')::int`,
        driversOnRoad: sql<number>`count(distinct ${table.driverId}) filter (where ${table.status} = 'in_transit')::int`,
        completedThisMonth: sql<number>`count(*) filter (where ${table.status} = 'delivered' and ${table.scheduledOn} >= date_trunc('month', current_date))::int`,
        completedLastMonth: sql<number>`count(*) filter (where ${table.status} = 'delivered' and ${table.scheduledOn} >= date_trunc('month', current_date) - interval '1 month' and ${table.scheduledOn} < date_trunc('month', current_date))::int`,
        failedThisMonth: sql<number>`count(*) filter (where ${table.status} = 'failed' and ${table.scheduledOn} >= date_trunc('month', current_date))::int`,
      })
      .from(table),
    db
      .select({
        awaiting: sql<number>`count(*) filter (where ${table.status} in ('scheduled','preparing'))::int`,
        overdue: sql<number>`count(*) filter (where ${table.status} in ('scheduled','preparing') and ${table.scheduledOn} < current_date)::int`,
      })
      .from(table),
  ]);

  const settled = runs.completedThisMonth + runs.failedThisMonth;

  return {
    pendingDispatch: pending.awaiting,
    overdueDispatch: pending.overdue,
    today: runs.today,
    completedToday: runs.completedToday,
    remainingToday: Math.max(runs.today - runs.completedToday, 0),
    inTransit: runs.inTransit,
    driversOnRoad: runs.driversOnRoad,
    completedThisMonth: runs.completedThisMonth,
    monthChange: runs.completedThisMonth - runs.completedLastMonth,
    successRate: settled > 0 ? (runs.completedThisMonth / settled) * 100 : 100,
  };
}

/** Driver picker options for the dispatch form. */
export async function getDriverOptions() {
  return db
    .select({ id: users.id, name: users.name, dutyStatus: users.dutyStatus })
    .from(users)
    .where(and(eq(users.role, "driver"), eq(users.isActive, true)))
    .orderBy(users.name);
}

/** Orders that are ready to go but have no delivery booked yet. */
export async function getUndispatchedOrders() {
  return db
    .select({
      id: orders.id,
      reference: orders.reference,
      customerName: customers.name,
      items: sql<number>`(
        select count(*)::int from order_items where order_items.order_id = orders.id
      )`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(
      sql`${orders.status} in ('confirmed','preparing','ready')
        and ${orders.deliveryMethod} <> 'pickup'
        and not exists (select 1 from deliveries where deliveries.order_id = orders.id)`,
    )
    .orderBy(asc(orders.placedAt));
}
