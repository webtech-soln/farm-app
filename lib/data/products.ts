import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { orderItems, orders, products as table } from "@/lib/db/schema";

import { count, decimal, display, money, percent, PRODUCT_STATUS } from "./common";

/** Icon keys resolved to lucide components on the page. */
export type ProductIcon =
  | "package"
  | "egg"
  | "bird"
  | "sprout"
  | "layers"
  | "beef";

const ICONS: ProductIcon[] = [
  "package",
  "egg",
  "bird",
  "sprout",
  "layers",
  "beef",
];

function iconFor(value: string | null): ProductIcon {
  return ICONS.includes(value as ProductIcon) ? (value as ProductIcon) : "package";
}

export type ProductRow = {
  id: number;
  name: string;
  category: string;
  icon: ProductIcon;
  status: string;
  statusTone: Tone;
  price: string;
  unit: string;
  /** Availability line; tinted when the product has run out. */
  available: string;
  availableTone?: Tone;
  note: string;
};

export async function getProducts(): Promise<ProductRow[]> {
  const rows = await db
    .select()
    .from(table)
    .where(eq(table.isActive, true))
    .orderBy(desc(table.availableQty));

  return rows.map((row) => {
    const statusDisplay = display(PRODUCT_STATUS, row.status);
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      icon: iconFor(row.icon),
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      price: money(row.priceCents),
      unit: row.unit,
      available: `${count(row.availableQty)} ${row.availableUnit ?? "available"}`,
      availableTone: row.availableQty <= 0 ? "error" : undefined,
      note: row.note ?? "—",
    };
  });
}

export type ProductPerformanceRow = {
  id: number;
  name: string;
  units: string;
  revenue: string;
  cost: string;
  margin: string;
  /** Tints the margin figure; omit for an untinted reading. */
  marginTone?: Tone;
  orders: string;
  trend: string;
  trendTone: Tone;
};

/**
 * Sales performance per product over a rolling window. Cancelled orders are
 * excluded — they never became revenue.
 */
export async function getProductPerformance(
  days = 30,
): Promise<ProductPerformanceRow[]> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      unit: table.unit,
      status: table.status,
      costCents: table.costCents,
      units: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)::double precision`,
      revenue: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)::bigint`,
      orderCount: sql<number>`count(distinct ${orders.id}) filter (where ${orders.placedAt} >= current_date - ${days}::int)::int`,
      previousRevenue: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${orders.placedAt} >= current_date - ${days * 2}::int and ${orders.placedAt} < current_date - ${days}::int), 0)::bigint`,
    })
    .from(table)
    .leftJoin(orderItems, eq(orderItems.productId, table.id))
    .leftJoin(
      orders,
      sql`${orders.id} = ${orderItems.orderId} and ${orders.status} <> 'cancelled'`,
    )
    .where(eq(table.isActive, true))
    .groupBy(table.id, table.name, table.unit, table.status, table.costCents)
    .orderBy(
      desc(
        sql`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)`,
      ),
    );

  return rows.map((row) => {
    const revenue = Number(row.revenue);
    const previous = Number(row.previousRevenue);
    const cost = Math.round(row.units * row.costCents);
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : null;

    // Products with no sales in either window read as flat, not "declining",
    // and a first-ever sale is "New" rather than infinite growth.
    let trend = "Steady";
    let trendTone: Tone = "info";
    if (row.status === "out_of_stock") {
      trend = "Out of stock";
      trendTone = "error";
    } else if (revenue === 0 && previous === 0) {
      trend = "No sales";
      trendTone = "neutral";
    } else if (previous === 0) {
      trend = "New";
      trendTone = "success";
    } else if (revenue > previous * 1.05) {
      trend = "Growing";
      trendTone = "success";
    } else if (revenue < previous * 0.95) {
      trend = "Declining";
      trendTone = "warning";
    }

    return {
      id: row.id,
      name: row.name,
      units:
        row.unit === "per kg"
          ? `${decimal(row.units, 0)} kg`
          : count(row.units),
      revenue: money(revenue),
      cost: money(cost),
      margin: margin === null ? "—" : percent(margin),
      marginTone:
        margin === null ? "neutral" : margin >= 30 ? "success" : undefined,
      orders: count(row.orderCount),
      trend,
      trendTone,
    };
  });
}

export async function getProductKpis(days = 30) {
  const [[counts], [sales]] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${table.isActive})::int`,
        outOfStock: sql<number>`count(*) filter (where ${table.isActive} and ${table.status} = 'out_of_stock')::int`,
      })
      .from(table),
    db
      .select({
        units: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)::double precision`,
        revenue: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)::bigint`,
        cost: sql<number>`coalesce(sum(${orderItems.quantity} * ${table.costCents}) filter (where ${orders.placedAt} >= current_date - ${days}::int), 0)::bigint`,
        previousRevenue: sql<number>`coalesce(sum(${orderItems.lineTotalCents}) filter (where ${orders.placedAt} >= current_date - ${days * 2}::int and ${orders.placedAt} < current_date - ${days}::int), 0)::bigint`,
        previousUnits: sql<number>`coalesce(sum(${orderItems.quantity}) filter (where ${orders.placedAt} >= current_date - ${days * 2}::int and ${orders.placedAt} < current_date - ${days}::int), 0)::double precision`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .leftJoin(table, eq(table.id, orderItems.productId))
      .where(sql`${orders.status} <> 'cancelled'`),
  ]);

  const revenue = Number(sales.revenue);
  const previousRevenue = Number(sales.previousRevenue);
  const cost = Number(sales.cost);

  return {
    active: counts.active,
    outOfStock: counts.outOfStock,
    units: sales.units,
    unitsChangePct:
      sales.previousUnits > 0
        ? ((sales.units - sales.previousUnits) / sales.previousUnits) * 100
        : 0,
    revenue,
    revenueLabel: money(revenue),
    revenueChangePct:
      previousRevenue > 0
        ? ((revenue - previousRevenue) / previousRevenue) * 100
        : 0,
    averageMargin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
  };
}

export type ProductFormValues = {
  id: number;
  name: string;
  category: string;
  icon: string;
  priceCents: number;
  costCents: number;
  unit: string;
  availableQty: number;
  availableUnit: string | null;
  note: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getProductFormValues(): Promise<
  Map<number, ProductFormValues>
> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      category: table.category,
      icon: table.icon,
      priceCents: table.priceCents,
      costCents: table.costCents,
      unit: table.unit,
      availableQty: table.availableQty,
      availableUnit: table.availableUnit,
      note: table.note,
    })
    .from(table)
    .where(eq(table.isActive, true));

  return new Map(rows.map((row) => [row.id, row]));
}

/** Product picker options for the order form. */
export async function getProductOptions() {
  return db
    .select({
      id: table.id,
      name: table.name,
      unit: table.unit,
      priceCents: table.priceCents,
      availableQty: table.availableQty,
    })
    .from(table)
    .where(eq(table.isActive, true))
    .orderBy(table.name);
}
