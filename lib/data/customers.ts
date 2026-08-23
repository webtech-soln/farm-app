import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { customers as table, orders, payments } from "@/lib/db/schema";

import {
  axis,
  count,
  CUSTOMER_STATUS,
  CUSTOMER_TYPE,
  daysBetween,
  display,
  DONUT_COLORS,
  formatDate,
  initialsFor,
  money,
  recentMonths,
} from "./common";

/** Orders per month, split by whether the buyer was new or returning. */
export async function getCustomerMix(months = 8) {
  const range = recentMonths(months);

  /*
   * A customer counts as "new" in the month of their first order, so the
   * split is derived from each order's position in that customer's history
   * rather than from a flag on the row.
   */
  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.placedAt}), 'YYYY-MM')`,
      fresh: sql<number>`count(*) filter (where date_trunc('month', ${orders.placedAt}) = first_order.month)::int`,
      returning: sql<number>`count(*) filter (where date_trunc('month', ${orders.placedAt}) > first_order.month)::int`,
    })
    .from(orders)
    .innerJoin(
      sql`(
        select customer_id, date_trunc('month', min(placed_at)) as month
        from orders group by customer_id
      ) as first_order`,
      sql`first_order.customer_id = ${orders.customerId}`,
    )
    .where(
      sql`${orders.placedAt} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .groupBy(sql`date_trunc('month', ${orders.placedAt})`);

  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const returning = range.map((entry) => byMonth.get(entry.key)?.returning ?? 0);
  const fresh = range.map((entry) => byMonth.get(entry.key)?.fresh ?? 0);
  const { max, ticks } = axis(
    Math.max(...range.map((_, index) => returning[index] + fresh[index]), 1),
  );

  return { labels: range.map((entry) => entry.label), ticks, max, returning, fresh };
}

export async function getRevenueByType() {
  const rows = await db
    .select({
      type: table.type,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
    })
    .from(table)
    .leftJoin(
      orders,
      and(eq(orders.customerId, table.id), sql`${orders.status} <> 'cancelled'`),
    )
    .groupBy(table.type)
    .orderBy(desc(sql`coalesce(sum(${orders.totalCents}), 0)`));

  return rows.map((row, index) => ({
    name: CUSTOMER_TYPE[row.type] ?? row.type,
    value: Number(row.revenue),
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: money(Number(row.revenue)),
  }));
}

export type CustomerRow = {
  id: number;
  name: string;
  descriptor: string;
  type: string;
  orders: string;
  purchases: string;
  outstanding: string;
  /** Tints the balance; omitted when the account is settled. */
  outstandingTone?: Tone;
  lastPurchase: string;
  status: string;
  statusTone: Tone;
  /** Dormant accounts drop the badge dot on the board. */
  statusDot?: boolean;
};

export type CustomerFilters = {
  search?: string;
  type?: string;
  status?: string;
};

/**
 * The balance owed is what has been invoiced on non-cancelled orders minus
 * what has been paid, so it always reconciles with the payments ledger.
 */
const OUTSTANDING = sql<number>`(
  coalesce((
    select sum(total_cents) from orders
    where orders.customer_id = customers.id and orders.status <> 'cancelled'
  ), 0)
  - coalesce((
    select sum(amount_cents) from payments where payments.customer_id = customers.id
  ), 0)
)::bigint`;

export async function getCustomers(
  filters: CustomerFilters = {},
): Promise<CustomerRow[]> {
  const conditions = [];

  if (filters.type) {
    conditions.push(sql`${table.type}::text = ${filters.type}`);
  }
  if (filters.status) {
    conditions.push(sql`${table.status}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${table.name}) like ${term} or lower(coalesce(${table.location}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      type: table.type,
      location: table.location,
      status: table.status,
      outstanding: OUTSTANDING,
      orderCount: sql<number>`(
        select count(*)::int from orders
        where orders.customer_id = customers.id and orders.status <> 'cancelled'
      )`,
      purchases: sql<number>`(
        select coalesce(sum(total_cents), 0)::bigint from orders
        where orders.customer_id = customers.id and orders.status <> 'cancelled'
      )`,
      lastOrderAt: sql<Date | null>`(
        select max(placed_at) from orders where orders.customer_id = customers.id
      )`,
    })
    .from(table)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(
        sql`(select coalesce(sum(total_cents), 0) from orders where orders.customer_id = customers.id and orders.status <> 'cancelled')`,
      ),
    );

  return rows.map((row) => {
    const statusDisplay = display(CUSTOMER_STATUS, row.status);
    const outstanding = Number(row.outstanding);
    const idleDays = row.lastOrderAt
      ? daysBetween(new Date(row.lastOrderAt), new Date())
      : null;
    // 30 days without an order is the point the board calls an account overdue.
    const overdue = outstanding > 0 && idleDays !== null && idleDays > 30;

    return {
      id: row.id,
      name: row.name,
      descriptor: [CUSTOMER_TYPE[row.type] ?? row.type, row.location]
        .filter(Boolean)
        .join(" · "),
      type: CUSTOMER_TYPE[row.type] ?? row.type,
      orders: count(row.orderCount),
      purchases: money(Number(row.purchases)),
      outstanding: money(Math.max(outstanding, 0)),
      outstandingTone:
        outstanding <= 0 ? undefined : overdue ? "error" : "warning",
      lastPurchase: row.lastOrderAt ? formatDate(new Date(row.lastOrderAt)) : "—",
      status: overdue ? `Overdue ${idleDays}d` : statusDisplay.label,
      statusTone: overdue ? "error" : statusDisplay.tone,
      statusDot: row.status === "dormant" ? false : undefined,
    };
  });
}

export async function getCustomerKpis() {
  const [[counts], [activity]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        newThisMonth: sql<number>`count(*) filter (where ${table.createdAt} >= date_trunc('month', current_date))::int`,
        owing: sql<number>`count(*) filter (where ${OUTSTANDING} > 0)::int`,
        outstanding: sql<number>`coalesce(sum(greatest(${OUTSTANDING}, 0)), 0)::bigint`,
      })
      .from(table),
    db
      .select({
        activeThisMonth: sql<number>`count(distinct ${orders.customerId}) filter (where ${orders.placedAt} >= date_trunc('month', current_date))::int`,
        activeLastMonth: sql<number>`count(distinct ${orders.customerId}) filter (where ${orders.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${orders.placedAt} < date_trunc('month', current_date))::int`,
        revenueThisMonth: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt} >= date_trunc('month', current_date)), 0)::bigint`,
        ordersThisMonth: sql<number>`count(*) filter (where ${orders.placedAt} >= date_trunc('month', current_date))::int`,
        revenueLastMonth: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${orders.placedAt} < date_trunc('month', current_date)), 0)::bigint`,
        ordersLastMonth: sql<number>`count(*) filter (where ${orders.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${orders.placedAt} < date_trunc('month', current_date))::int`,
      })
      .from(orders)
      .where(sql`${orders.status} <> 'cancelled'`),
  ]);

  const averageOrder =
    activity.ordersThisMonth > 0
      ? Number(activity.revenueThisMonth) / activity.ordersThisMonth
      : 0;
  const previousAverage =
    activity.ordersLastMonth > 0
      ? Number(activity.revenueLastMonth) / activity.ordersLastMonth
      : 0;

  return {
    total: counts.total,
    newThisMonth: counts.newThisMonth,
    activeThisMonth: activity.activeThisMonth,
    activeChange: activity.activeThisMonth - activity.activeLastMonth,
    activeSharePct:
      counts.total > 0 ? (activity.activeThisMonth / counts.total) * 100 : 0,
    outstanding: Number(counts.outstanding),
    outstandingLabel: money(Number(counts.outstanding)),
    accountsOwing: counts.owing,
    averageOrder,
    averageOrderLabel: money(Math.round(averageOrder)),
    averageOrderChangePct:
      previousAverage > 0
        ? ((averageOrder - previousAverage) / previousAverage) * 100
        : 0,
  };
}

/** Highest-spending customers, for the sales board's leaderboard. */
export async function getTopCustomers(limit = 5, days = 30) {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
    })
    .from(table)
    .innerJoin(
      orders,
      and(
        eq(orders.customerId, table.id),
        sql`${orders.status} <> 'cancelled'`,
        sql`${orders.placedAt} >= current_date - ${days}::int`,
      ),
    )
    .groupBy(table.id, table.name)
    .orderBy(desc(sql`coalesce(sum(${orders.totalCents}), 0)`))
    .limit(limit);

  const top = Number(rows[0]?.revenue ?? 0);

  return rows.map((row) => {
    const revenue = Number(row.revenue);
    return {
      id: row.id,
      initials: initialsFor(row.name),
      name: row.name,
      revenue: money(revenue),
      share: top > 0 ? Math.round((revenue / top) * 100) : 0,
    };
  });
}

export type CustomerFormValues = {
  id: number;
  name: string;
  type: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  creditLimitCents: number | null;
  notes: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getCustomerFormValues(): Promise<
  Map<number, CustomerFormValues>
> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      type: table.type,
      location: table.location,
      phone: table.phone,
      email: table.email,
      status: table.status,
      creditLimitCents: table.creditLimitCents,
      notes: table.notes,
    })
    .from(table);

  return new Map(rows.map((row) => [row.id, row]));
}

/** Customer picker options for the order form. */
export async function getCustomerOptions() {
  return db
    .select({
      id: table.id,
      name: table.name,
      type: table.type,
      creditLimitCents: table.creditLimitCents,
    })
    .from(table)
    .orderBy(table.name);
}

export async function getCustomerPayments(customerId: number, limit = 10) {
  return db
    .select({
      id: payments.id,
      amountCents: payments.amountCents,
      method: payments.method,
      receivedOn: payments.receivedOn,
      reference: payments.reference,
    })
    .from(payments)
    .where(eq(payments.customerId, customerId))
    .orderBy(desc(payments.receivedOn))
    .limit(limit);
}
