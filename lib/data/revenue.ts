import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

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
  formatDate,
  money,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  recentMonths,
} from "./common";

const BOOKED = sql`${orders.status} <> 'cancelled'`;

/**
 * Revenue is billed in two ways: through an order, and as a settlement booked
 * straight against a customer with no order behind it (standing supply, cash
 * sales at the gate). Both count as invoiced; only the second is guaranteed
 * to already be collected, so the two ledgers are summed separately and then
 * combined here.
 */
export async function getInvoicedByMonth(months: number) {
  const since = sql.raw(`interval '${months - 1} months'`);

  const [orderRows, standaloneRows] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${orders.placedAt}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${orders.totalCents}), 0)::bigint`,
      })
      .from(orders)
      .where(
        sql`${BOOKED} and ${orders.placedAt} >= date_trunc('month', current_date) - ${since}`,
      )
      .groupBy(sql`date_trunc('month', ${orders.placedAt})`),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${payments.receivedOn}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`,
      })
      .from(payments)
      .where(
        sql`${payments.orderId} is null and ${payments.receivedOn} >= date_trunc('month', current_date) - ${since}`,
      )
      .groupBy(sql`date_trunc('month', ${payments.receivedOn})`),
  ]);

  const byMonth = new Map<string, number>();
  for (const row of [...orderRows, ...standaloneRows]) {
    byMonth.set(row.month, (byMonth.get(row.month) ?? 0) + Number(row.total));
  }
  return byMonth;
}

/** Billed but not yet collected, taken order by order. */
export const RECEIVABLES = sql<number>`(
  select coalesce(sum(
    o.total_cents - coalesce((
      select sum(amount_cents) from payments where payments.order_id = o.id
    ), 0)
  ), 0)::bigint
  from orders o
  where o.status <> 'cancelled' and o.payment_status in ('unpaid', 'partial')
)`;

/**
 * Invoiced against collected, per month. The gap between the two series is
 * what the board reads as the receivables position over time.
 */
export async function getRevenueTrend(months = 8) {
  const range = recentMonths(months);
  const since = sql.raw(`interval '${months - 1} months'`);

  const [invoicedByMonth, collectedRows] = await Promise.all([
    getInvoicedByMonth(months),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${payments.receivedOn}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`,
      })
      .from(payments)
      .where(
        sql`${payments.receivedOn} >= date_trunc('month', current_date) - ${since}`,
      )
      .groupBy(sql`date_trunc('month', ${payments.receivedOn})`),
  ]);

  const collectedByMonth = new Map(
    collectedRows.map((row) => [row.month, Number(row.total)]),
  );

  const dollars = (cents: number) => Math.round(cents / 100);
  const invoiced = range.map((entry) =>
    dollars(invoicedByMonth.get(entry.key) ?? 0),
  );
  const collected = range.map((entry) =>
    dollars(collectedByMonth.get(entry.key) ?? 0),
  );

  const { max, ticks } = axis(
    Math.max(...invoiced, ...collected, 1),
    4,
    (value) =>
      value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)),
  );

  return { labels: range.map((entry) => entry.label), ticks, max, collected, invoiced };
}

/** Revenue split by the product category that produced it. */
export async function getRevenueByStream(days = 30, top = 4) {
  const rows = await db
    .select({
      category: sql<string>`coalesce(${products.category}, 'Other')`,
      total: sql<number>`coalesce(sum(${orderItems.lineTotalCents}), 0)::bigint`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(sql`${BOOKED} and ${orders.placedAt} >= current_date - ${days}::int`)
    .groupBy(sql`coalesce(${products.category}, 'Other')`)
    .orderBy(desc(sql`coalesce(sum(${orderItems.lineTotalCents}), 0)`));

  const ranked = rows.map((row) => ({
    name: row.category,
    value: Number(row.total),
  }));
  const slices = ranked.slice(0, top);
  const rest = ranked.slice(top);
  if (rest.length > 0) {
    slices.push({
      name: "Other",
      value: rest.reduce((sum, row) => sum + row.value, 0),
    });
  }

  return slices.map((slice, index) => ({
    name: slice.name,
    value: slice.value,
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: money(slice.value),
  }));
}

export type RevenueEntryRow = {
  id: number;
  date: string;
  reference: string;
  description: string;
  customer: string;
  amount: string;
  amountTone: Tone;
  method: string;
  status: string;
  statusTone: Tone;
};

/**
 * The revenue ledger reads off orders rather than payments so an unpaid
 * invoice still shows up as revenue earned, tinted by how much has landed.
 */
export type RevenueFilters = {
  search?: string;
  customer?: string;
  status?: string;
};

export async function getRevenueEntries(
  filters: RevenueFilters = {},
  limit = 25,
): Promise<RevenueEntryRow[]> {
  const conditions = [BOOKED];

  if (filters.customer) conditions.push(eq(customers.name, filters.customer));
  if (filters.status) {
    conditions.push(sql`${orders.paymentStatus}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${orders.reference}) like ${term} or lower(${customers.name}) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: orders.id,
      reference: orders.reference,
      placedAt: orders.placedAt,
      totalCents: orders.totalCents,
      paymentStatus: orders.paymentStatus,
      customerName: customers.name,
      items: sql<string>`(
        select string_agg(product_name, ', ' order by id)
        from order_items where order_items.order_id = orders.id
      )`,
      itemCount: sql<number>`(
        select count(*)::int from order_items where order_items.order_id = orders.id
      )`,
      method: sql<string | null>`(
        select method::text from payments
        where payments.order_id = orders.id
        order by received_on desc limit 1
      )`,
    })
    .from(orders)
    .innerJoin(customers, eq(customers.id, orders.customerId))
    .where(and(...conditions))
    .orderBy(desc(orders.placedAt))
    .limit(limit);

  return rows.map((row) => {
    const statusDisplay = display(PAYMENT_STATUS, row.paymentStatus);
    return {
      id: row.id,
      date: formatDate(row.placedAt),
      reference: `#${row.reference}`,
      description: row.items ?? `${row.itemCount} items`,
      customer: row.customerName,
      amount: money(row.totalCents),
      amountTone:
        row.paymentStatus === "paid"
          ? "success"
          : row.paymentStatus === "partial"
            ? "warning"
            : "error",
      method: row.method
        ? (PAYMENT_METHOD[row.method] ?? row.method)
        : "Awaiting payment",
      status: row.paymentStatus === "paid" ? "Received" : statusDisplay.label,
      statusTone: statusDisplay.tone,
    };
  });
}

export async function getRevenueKpis() {
  const [invoicedByMonth, [orderStats], [receivable], [byCategory]] =
    await Promise.all([
      getInvoicedByMonth(2),
      db
        .select({
          unpaidOrders: sql<number>`count(*) filter (where ${orders.paymentStatus} in ('unpaid','partial'))::int`,
        })
        .from(orders)
        .where(BOOKED),
      db.select({ total: RECEIVABLES }).from(sql`(select 1) as one`),
    /*
     * "Other revenue" is everything that is not a core poultry or egg line —
     * manure, spent layers and the like.
     */
    db
      .select({
        core: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${products.category} in ('Poultry','Eggs','Processed')), 0)::bigint`,
        other: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${products.category} not in ('Poultry','Eggs','Processed') or ${products.category} is null), 0)::bigint`,
      })
      .from(orderItems)
      .innerJoin(
        orders,
        and(eq(orders.id, orderItems.orderId), BOOKED),
      )
      .leftJoin(products, eq(products.id, orderItems.productId))
      .where(sql`${orders.placedAt} >= date_trunc('month', current_date)`),
  ]);

  const months = [...invoicedByMonth.keys()].sort();
  const month = invoicedByMonth.get(months.at(-1) ?? "") ?? 0;
  const lastMonth =
    months.length > 1 ? (invoicedByMonth.get(months.at(-2)!) ?? 0) : 0;
  const core = Number(byCategory.core);
  // Everything that is not a core poultry/egg order line: by-products plus
  // settlements booked without an order behind them.
  const other = Math.max(month - core, 0);
  const outstanding = Number(receivable.total);

  return {
    month,
    monthLabel: money(month),
    monthChangePct: lastMonth > 0 ? ((month - lastMonth) / lastMonth) * 100 : 0,
    core,
    coreLabel: money(core),
    coreSharePct: month > 0 ? (core / month) * 100 : 0,
    other,
    otherLabel: money(other),
    outstanding,
    outstandingLabel: money(outstanding),
    unpaidOrders: orderStats.unpaidOrders,
  };
}
