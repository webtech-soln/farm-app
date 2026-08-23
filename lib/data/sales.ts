import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  customers,
  orderItems,
  orders,
  payments,
  products,
} from "@/lib/db/schema";

import {
  axis,
  display,
  DONUT_COLORS,
  money,
  ORDER_STATUS,
  PAYMENT_STATUS,
  recentMonths,
} from "./common";

/** Non-cancelled orders are the only ones that count as sales. */
const BOOKED = sql`${orders.status} <> 'cancelled'`;

/**
 * Monthly revenue against a rolling target. The target is the trailing
 * three-month average grown by 4%, which is what the board plots as the
 * dashed reference series — there is no target table to read from.
 */
export async function getSalesTrend(months = 8) {
  const range = recentMonths(months);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${orders.placedAt}), 'YYYY-MM')`,
      revenue: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
    })
    .from(orders)
    .where(
      sql`${BOOKED} and ${orders.placedAt} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .groupBy(sql`date_trunc('month', ${orders.placedAt})`);

  const byMonth = new Map(rows.map((row) => [row.month, Number(row.revenue)]));
  const revenue = range.map((entry) =>
    Math.round((byMonth.get(entry.key) ?? 0) / 100),
  );

  const target = revenue.map((value, index) => {
    const window = revenue.slice(Math.max(index - 3, 0), index).filter(Boolean);
    // Before there is any history to grow from, the month is its own target.
    if (window.length === 0) return value;
    const average = window.reduce((sum, entry) => sum + entry, 0) / window.length;
    return Math.round(average * 1.04);
  });

  const { max, ticks } = axis(Math.max(...revenue, ...target, 1), 4, (value) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)),
  );

  return { labels: range.map((entry) => entry.label), ticks, max, revenue, target };
}

export async function getSalesByProduct(days = 30, top = 3) {
  const rows = await db
    .select({
      name: orderItems.productName,
      revenue: sql<number>`coalesce(sum(${orderItems.lineTotalCents}), 0)::bigint`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(sql`${BOOKED} and ${orders.placedAt} >= current_date - ${days}::int`)
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`coalesce(sum(${orderItems.lineTotalCents}), 0)`));

  const ranked = rows.map((row) => ({
    name: row.name,
    value: Number(row.revenue),
  }));
  const head = ranked.slice(0, top);
  const tail = ranked.slice(top);

  const slices = [...head];
  if (tail.length > 0) {
    slices.push({
      name: "Other",
      value: tail.reduce((sum, row) => sum + row.value, 0),
    });
  }

  return slices.map((slice, index) => ({
    name: slice.name,
    value: slice.value,
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: money(slice.value),
  }));
}

export type RecentOrderRow = {
  id: number;
  reference: string;
  summary: string;
  customer: string;
  total: string;
  payment: string;
  paymentTone: Tone;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export async function getRecentOrders(limit = 6): Promise<RecentOrderRow[]> {
  const rows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      customerName: customers.name,
      items: sql<number>`(
        select count(*)::int from order_items where order_items.order_id = orders.id
      )`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .orderBy(desc(orders.placedAt))
    .limit(limit);

  return rows.map((row) => {
    const statusDisplay = display(ORDER_STATUS, row.status);
    const paymentDisplay = display(PAYMENT_STATUS, row.paymentStatus);

    return {
      id: row.id,
      reference: `#${row.reference}`,
      summary: `${row.placedAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })} · ${row.items} item${row.items === 1 ? "" : "s"}`,
      customer: row.customerName,
      total: money(row.totalCents),
      payment: paymentDisplay.label,
      paymentTone: paymentDisplay.tone,
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusDot: row.status === "pending" ? false : undefined,
    };
  });
}

export async function getSalesKpis() {
  const [[sales], [outstanding]] = await Promise.all([
    db
      .select({
        today: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt}::date = current_date), 0)::bigint`,
        yesterday: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt}::date = current_date - 1), 0)::bigint`,
        ordersToday: sql<number>`count(*) filter (where ${orders.placedAt}::date = current_date)::int`,
        month: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt} >= date_trunc('month', current_date)), 0)::bigint`,
        lastMonth: sql<number>`coalesce(sum(${orders.totalCents}) filter (where ${orders.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${orders.placedAt} < date_trunc('month', current_date)), 0)::bigint`,
        ordersThisMonth: sql<number>`count(*) filter (where ${orders.placedAt} >= date_trunc('month', current_date))::int`,
        ordersLastMonth: sql<number>`count(*) filter (where ${orders.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${orders.placedAt} < date_trunc('month', current_date))::int`,
      })
      .from(orders)
      .where(BOOKED),
    db
      .select({
        invoiced: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
        unpaidOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} in ('unpaid','partial'))::int`,
      })
      .from(orders)
      .where(BOOKED),
  ]);

  const [[received]] = await Promise.all([
    db
      .select({
        total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`,
      })
      .from(payments),
  ]);

  const today = Number(sales.today);
  const yesterday = Number(sales.yesterday);
  const month = Number(sales.month);
  const lastMonth = Number(sales.lastMonth);
  const owed = Math.max(Number(outstanding.invoiced) - Number(received.total), 0);

  return {
    today,
    todayLabel: money(today),
    todayChangePct: yesterday > 0 ? ((today - yesterday) / yesterday) * 100 : 0,
    ordersToday: sales.ordersToday,
    month,
    monthLabel: money(month),
    monthChangePct: lastMonth > 0 ? ((month - lastMonth) / lastMonth) * 100 : 0,
    ordersThisMonth: sales.ordersThisMonth,
    ordersChange: sales.ordersThisMonth - sales.ordersLastMonth,
    outstanding: owed,
    outstandingLabel: money(owed),
    unpaidOrders: outstanding.unpaidOrders,
  };
}

/** Units sold per product, used by the products board. */
export async function getUnitsSold(days = 30) {
  return db
    .select({
      productId: products.id,
      name: products.name,
      units: sql<number>`coalesce(sum(${orderItems.quantity}), 0)::double precision`,
    })
    .from(products)
    .leftJoin(orderItems, eq(orderItems.productId, products.id))
    .leftJoin(
      orders,
      sql`${orders.id} = ${orderItems.orderId} and ${BOOKED} and ${orders.placedAt} >= current_date - ${days}::int`,
    )
    .groupBy(products.id, products.name)
    .orderBy(desc(sql`coalesce(sum(${orderItems.quantity}), 0)`));
}
