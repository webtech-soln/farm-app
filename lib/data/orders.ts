import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  customers,
  orderEvents,
  orderItems,
  orders as table,
  users,
} from "@/lib/db/schema";

import {
  count,
  CUSTOMER_TYPE,
  decimal,
  DELIVERY_METHOD,
  display,
  formatTime,
  initialsFor,
  money,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from "./common";

const STATUS_TABS = [
  "All",
  "Pending",
  "Confirmed",
  "Preparing",
  "Ready",
  "Delivered",
  "Cancelled",
] as const;

/** The status strip above the register; `All` is the default selection. */
export async function getOrderStatusCounts(): Promise<Record<string, number>> {
  const rows = await db
    .select({
      status: table.status,
      total: sql<number>`count(*)::int`,
    })
    .from(table)
    .groupBy(table.status);

  const counts: Record<string, number> = {};
  for (const tab of STATUS_TABS) counts[tab] = 0;

  for (const row of rows) {
    const label = display(ORDER_STATUS, row.status).label;
    // "In transit" has no tab of its own; it belongs with the ready-to-go work.
    const tab = STATUS_TABS.includes(label as (typeof STATUS_TABS)[number])
      ? label
      : "Ready";
    counts[tab] = (counts[tab] ?? 0) + row.total;
    counts.All += row.total;
  }

  return counts;
}

export type OrderRow = {
  id: number;
  reference: string;
  placedAt: string;
  customer: string;
  items: string;
  total: string;
  payment: string;
  paymentTone: Tone;
  paymentDot?: boolean;
  delivery: string;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
  /** Raw enum value, for the row actions. */
  statusKey: string;
};

export type OrderFilters = {
  search?: string;
  status?: string;
  paymentStatus?: string;
  customer?: string;
};

export async function getOrders(
  filters: OrderFilters = {},
  limit = 50,
  offset = 0,
): Promise<OrderRow[]> {
  const conditions = [];

  if (filters.status && filters.status !== "All") {
    conditions.push(sql`${table.status}::text = ${filters.status.toLowerCase().replace(/ /g, "_")}`);
  }
  if (filters.paymentStatus) {
    conditions.push(sql`${table.paymentStatus}::text = ${filters.paymentStatus}`);
  }
  if (filters.customer) conditions.push(eq(customers.name, filters.customer));
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${table.reference}) like ${term} or lower(${customers.name}) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      reference: table.reference,
      placedAt: table.placedAt,
      status: table.status,
      paymentStatus: table.paymentStatus,
      deliveryMethod: table.deliveryMethod,
      totalCents: table.totalCents,
      customerName: customers.name,
      items: sql<number>`(
        select count(*)::int from order_items where order_items.order_id = orders.id
      )`,
    })
    .from(table)
    .innerJoin(customers, eq(customers.id, table.customerId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(table.placedAt))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(ORDER_STATUS, row.status);
    const paymentDisplay = display(PAYMENT_STATUS, row.paymentStatus);

    return {
      id: row.id,
      reference: `#${row.reference}`,
      placedAt: `${row.placedAt.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })} · ${formatTime(row.placedAt)}`,
      customer: row.customerName,
      items: count(row.items),
      total: money(row.totalCents),
      payment: paymentDisplay.label,
      paymentTone: paymentDisplay.tone,
      paymentDot: row.paymentStatus === "refunded" ? false : undefined,
      delivery: DELIVERY_METHOD[row.deliveryMethod] ?? row.deliveryMethod,
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusKey: row.status,
      statusDot: row.status === "pending" ? false : undefined,
    };
  });
}

export type OrderEventIcon =
  | "delivered"
  | "transit"
  | "packed"
  | "payment"
  | "placed";

export type OrderTimelineEvent = {
  icon: OrderEventIcon;
  title: string;
  time: string;
  description: string;
};

const EVENT_ICONS: Record<string, OrderEventIcon> = {
  placed: "placed",
  payment: "payment",
  packed: "packed",
  transit: "transit",
  delivered: "delivered",
  cancelled: "packed",
};

/**
 * The order opened in the side panel: header, line items, totals and history.
 * Defaults to the most recent order when no reference is given.
 */
export async function getOrderDetail(reference?: string) {
  const [order] = await db
    .select({
      id: table.id,
      reference: table.reference,
      placedAt: table.placedAt,
      subtotalCents: table.subtotalCents,
      deliveryFeeCents: table.deliveryFeeCents,
      totalCents: table.totalCents,
      notes: table.notes,
      status: table.status,
      paymentStatus: table.paymentStatus,
      customerName: customers.name,
      customerType: customers.type,
      customerPhone: customers.phone,
    })
    .from(table)
    .innerJoin(customers, eq(customers.id, table.customerId))
    .where(reference ? eq(table.reference, reference.replace(/^#/, "")) : undefined)
    .orderBy(desc(table.placedAt))
    .limit(1);

  if (!order) return null;

  const [lines, history] = await Promise.all([
    db
      .select({
        id: orderItems.id,
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        unit: orderItems.unit,
        unitPriceCents: orderItems.unitPriceCents,
        lineTotalCents: orderItems.lineTotalCents,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id))
      .orderBy(asc(orderItems.id)),
    db
      .select({
        id: orderEvents.id,
        kind: orderEvents.kind,
        title: orderEvents.title,
        description: orderEvents.description,
        occurredAt: orderEvents.occurredAt,
        createdBy: users.name,
      })
      .from(orderEvents)
      .leftJoin(users, eq(users.id, orderEvents.createdById))
      .where(eq(orderEvents.orderId, order.id))
      .orderBy(desc(orderEvents.occurredAt)),
  ]);

  return {
    id: order.id,
    reference: `#${order.reference}`,
    placed: `Placed ${order.placedAt.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} · ${formatTime(order.placedAt)}`,
    status: display(ORDER_STATUS, order.status).label,
    statusTone: display(ORDER_STATUS, order.status).tone,
    payment: display(PAYMENT_STATUS, order.paymentStatus).label,
    notes: order.notes,
    customer: {
      initials: initialsFor(order.customerName),
      name: order.customerName,
      meta: [
        CUSTOMER_TYPE[order.customerType] ?? order.customerType,
        order.customerPhone,
      ]
        .filter(Boolean)
        .join(" · "),
    },
    lines: lines.map((line) => ({
      id: line.id,
      name: line.productName,
      detail: `${decimal(line.quantity, line.quantity % 1 === 0 ? 0 : 1)} ${
        line.unit
      } × ${money(line.unitPriceCents)}`,
      amount: money(line.lineTotalCents),
    })),
    totals: [
      { label: "Subtotal", value: money(order.subtotalCents) },
      { label: "Delivery", value: money(order.deliveryFeeCents) },
      { label: "Total", value: money(order.totalCents), strong: true },
    ],
    timeline: history.map((event): OrderTimelineEvent => ({
      icon: EVENT_ICONS[event.kind] ?? "placed",
      title: event.title,
      time: formatTime(event.occurredAt),
      description:
        event.description ??
        (event.createdBy ? `Recorded by ${event.createdBy}.` : ""),
    })),
  };
}

export async function getOrderKpis() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      thisMonth: sql<number>`count(*) filter (where ${table.placedAt} >= date_trunc('month', current_date))::int`,
      lastMonth: sql<number>`count(*) filter (where ${table.placedAt} >= date_trunc('month', current_date) - interval '1 month' and ${table.placedAt} < date_trunc('month', current_date))::int`,
      open: sql<number>`count(*) filter (where ${table.status} in ('pending','confirmed','preparing','ready'))::int`,
      unpaid: sql<number>`count(*) filter (where ${table.paymentStatus} in ('unpaid','partial'))::int`,
      revenueThisMonth: sql<number>`coalesce(sum(${table.totalCents}) filter (where ${table.placedAt} >= date_trunc('month', current_date) and ${table.status} <> 'cancelled'), 0)::bigint`,
    })
    .from(table);

  return {
    total: row.total,
    thisMonth: row.thisMonth,
    monthChange: row.thisMonth - row.lastMonth,
    open: row.open,
    unpaid: row.unpaid,
    revenueThisMonth: Number(row.revenueThisMonth),
  };
}

/** Payment methods on record, for the payment form. */
export function getPaymentMethods() {
  return Object.entries(PAYMENT_METHOD).map(([value, label]) => ({
    value,
    label,
  }));
}

/** Orders that still owe money, for the payment picker. */
export async function getOpenOrderOptions() {
  const rows = await db
    .select({
      id: table.id,
      reference: table.reference,
      customerName: customers.name,
    })
    .from(table)
    .innerJoin(customers, eq(customers.id, table.customerId))
    .where(
      sql`${table.paymentStatus} <> 'paid' and ${table.status} <> 'cancelled'`,
    )
    .orderBy(desc(table.placedAt))
    .limit(100);

  return rows;
}
