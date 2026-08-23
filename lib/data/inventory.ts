import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  inventoryItems as inventoryTable,
  inventoryMovements,
  suppliers,
} from "@/lib/db/schema";

import {
  DONUT_COLORS,
  INVENTORY_CATEGORY,
  axis,
  compactTick,
  count,
  daysBetween,
  formatDate,
  money,
} from "./common";
import { getFarmSettings } from "./settings";

export type InventoryCategory =
  | "feed"
  | "medicine"
  | "equipment"
  | "packaging"
  | "consumable"
  | "other";

export type StockRow = {
  id: number;
  name: string;
  sku: string;
  category: string;
  categoryKey: InventoryCategory;
  subcategory: string;
  quantity: string;
  quantityValue: number;
  quantityTone?: Tone;
  unit: string;
  unitCost: string;
  totalValue: string;
  minStock: string;
  batch: string;
  supplier: string;
  expiration: string;
  expiryNote: string;
  status: string;
  statusTone: Tone;
};

export type InventoryFilters = {
  search?: string;
  category?: InventoryCategory;
  supplier?: string;
  status?: "in_stock" | "low" | "below_minimum" | "expiring";
};

/**
 * Stock status is derived, never stored: it is a function of the live quantity
 * against the minimum, and of the expiry against the warning window.
 */
function stockStatus(
  quantity: number,
  minStock: number,
  expiryDate: string | null,
  expiryWarningDays: number,
): { status: string; statusTone: Tone; quantityTone?: Tone } {
  const daysToExpiry = expiryDate ? daysBetween(new Date(), expiryDate) : null;
  const expiringSoon =
    daysToExpiry !== null && daysToExpiry >= 0 && daysToExpiry <= expiryWarningDays;
  const expired = daysToExpiry !== null && daysToExpiry < 0;
  const belowMinimum = quantity < minStock;
  const nearMinimum = !belowMinimum && minStock > 0 && quantity <= minStock * 1.1;

  if (expired) {
    return { status: "Expired", statusTone: "error", quantityTone: "error" };
  }
  if (belowMinimum && expiringSoon) {
    return { status: "Expiring · low", statusTone: "error", quantityTone: "error" };
  }
  if (belowMinimum) {
    return { status: "Below minimum", statusTone: "error", quantityTone: "error" };
  }
  if (expiringSoon) {
    return { status: "Expiring soon", statusTone: "warning", quantityTone: "warning" };
  }
  if (nearMinimum) {
    return { status: "Reorder soon", statusTone: "warning", quantityTone: "warning" };
  }
  return { status: "In stock", statusTone: "success" };
}

export async function getInventoryItems(
  filters: InventoryFilters = {},
): Promise<StockRow[]> {
  const settings = await getFarmSettings();
  const conditions = [eq(inventoryTable.isActive, true)];

  if (filters.category) conditions.push(eq(inventoryTable.category, filters.category));
  if (filters.supplier) conditions.push(eq(suppliers.name, filters.supplier));
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${inventoryTable.name}) like ${term} or lower(${inventoryTable.sku}) like ${term} or lower(coalesce(${inventoryTable.batch}, '')) like ${term})`,
    );
  }
  if (filters.status === "below_minimum") {
    conditions.push(sql`${inventoryTable.quantity} < ${inventoryTable.minStock}`);
  }
  if (filters.status === "low") {
    conditions.push(sql`${inventoryTable.quantity} <= ${inventoryTable.minStock} * 1.1`);
  }
  if (filters.status === "expiring") {
    conditions.push(
      sql`${inventoryTable.expiryDate} is not null and ${inventoryTable.expiryDate} <= current_date + ${settings.medicineExpiryWarningDays}::int`,
    );
  }

  const rows = await db
    .select({
      id: inventoryTable.id,
      sku: inventoryTable.sku,
      name: inventoryTable.name,
      category: inventoryTable.category,
      subcategory: inventoryTable.subcategory,
      quantity: inventoryTable.quantity,
      unit: inventoryTable.unit,
      unitCostCents: inventoryTable.unitCostCents,
      minStock: inventoryTable.minStock,
      batch: inventoryTable.batch,
      expiryDate: inventoryTable.expiryDate,
      supplierName: suppliers.name,
    })
    .from(inventoryTable)
    .leftJoin(suppliers, eq(suppliers.id, inventoryTable.supplierId))
    .where(and(...conditions))
    .orderBy(inventoryTable.category, inventoryTable.name);

  return rows.map((row) => {
    const state = stockStatus(
      row.quantity,
      row.minStock,
      row.expiryDate,
      settings.medicineExpiryWarningDays,
    );
    const daysToExpiry = row.expiryDate
      ? daysBetween(new Date(), row.expiryDate)
      : null;

    return {
      id: row.id,
      name: row.name,
      sku: `SKU ${row.sku}`,
      category: INVENTORY_CATEGORY[row.category] ?? row.category,
      categoryKey: row.category,
      subcategory: row.subcategory ?? "—",
      quantity: count(row.quantity),
      quantityValue: row.quantity,
      quantityTone: state.quantityTone,
      unit: row.unit,
      unitCost: money(row.unitCostCents),
      totalValue: money(Math.round(row.quantity * row.unitCostCents)),
      minStock: `${count(row.minStock)} ${row.unit}`,
      batch: row.batch ?? "—",
      supplier: row.supplierName ?? "—",
      expiration: row.expiryDate ? formatDate(row.expiryDate) : "—",
      expiryNote:
        daysToExpiry === null
          ? "—"
          : daysToExpiry < 0
            ? `Expired ${Math.abs(daysToExpiry)} days ago`
            : `${daysToExpiry} days left`,
      status: state.status,
      statusTone: state.statusTone,
    };
  });
}

export async function getInventoryItem(id: number) {
  const [row] = await db
    .select()
    .from(inventoryTable)
    .where(eq(inventoryTable.id, id))
    .limit(1);
  return row ?? null;
}

/** Stock in versus stock out per week, for the movement chart. */
export async function getStockMovement(weeks = 8) {
  const rows = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${inventoryMovements.occurredOn}), 'YYYY-MM-DD')`,
      stockIn: sql<number>`coalesce(sum(${inventoryMovements.quantity}) filter (where ${inventoryMovements.type} = 'stock_in'), 0)::int`,
      stockOut: sql<number>`coalesce(sum(${inventoryMovements.quantity}) filter (where ${inventoryMovements.type} = 'stock_out'), 0)::int`,
    })
    .from(inventoryMovements)
    .where(
      sql`${inventoryMovements.occurredOn} >= date_trunc('week', current_date) - ${sql.raw(`interval '${weeks - 1} weeks'`)}`,
    )
    .groupBy(sql`date_trunc('week', ${inventoryMovements.occurredOn})`)
    .orderBy(sql`date_trunc('week', ${inventoryMovements.occurredOn})`);

  const stockIn = rows.map((row) => row.stockIn);
  const stockOut = rows.map((row) => row.stockOut);
  const { max, ticks } = axis(Math.max(...stockIn, ...stockOut, 1), 4, compactTick,
  );

  return {
    labels: rows.map((_, index) => `W${index + 1}`),
    ticks,
    max,
    stockIn,
    stockOut,
  };
}

export async function getValueByCategory() {
  const rows = await db
    .select({
      category: inventoryTable.category,
      value: sql<number>`coalesce(sum(${inventoryTable.quantity} * ${inventoryTable.unitCostCents}), 0)::bigint`,
    })
    .from(inventoryTable)
    .where(eq(inventoryTable.isActive, true))
    .groupBy(inventoryTable.category)
    .orderBy(desc(sql`sum(${inventoryTable.quantity} * ${inventoryTable.unitCostCents})`));

  return rows.map((row, index) => ({
    name: INVENTORY_CATEGORY[row.category] ?? row.category,
    value: Number(row.value),
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: money(Number(row.value)),
  }));
}

export async function getInventoryKpis() {
  const settings = await getFarmSettings();

  const [totals] = await db
    .select({
      items: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(${inventoryTable.quantity} * ${inventoryTable.unitCostCents}), 0)::bigint`,
      belowMinimum: sql<number>`count(*) filter (where ${inventoryTable.quantity} < ${inventoryTable.minStock})::int`,
      expiring: sql<number>`count(*) filter (where ${inventoryTable.expiryDate} is not null and ${inventoryTable.expiryDate} <= current_date + ${settings.medicineExpiryWarningDays}::int)::int`,
    })
    .from(inventoryTable)
    .where(eq(inventoryTable.isActive, true));

  return {
    items: totals.items,
    totalValue: Number(totals.value),
    totalValueLabel: money(Number(totals.value)),
    belowMinimum: totals.belowMinimum,
    expiring: totals.expiring,
  };
}

export async function getRecentMovements(limit = 20) {
  const rows = await db
    .select({
      id: inventoryMovements.id,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      occurredOn: inventoryMovements.occurredOn,
      reference: inventoryMovements.reference,
      note: inventoryMovements.note,
      itemName: inventoryTable.name,
      unit: inventoryTable.unit,
    })
    .from(inventoryMovements)
    .innerJoin(inventoryTable, eq(inventoryTable.id, inventoryMovements.itemId))
    .orderBy(desc(inventoryMovements.occurredOn), desc(inventoryMovements.id))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    date: formatDate(row.occurredOn),
    item: row.itemName,
    type: row.type === "stock_in" ? "Stock in" : row.type === "stock_out" ? "Stock out" : "Adjustment",
    tone: (row.type === "stock_in" ? "success" : row.type === "stock_out" ? "info" : "neutral") as Tone,
    // An adjustment is a recount, not a delta, so it reads as a balance.
    quantity: `${row.type === "stock_in" ? "+" : row.type === "stock_out" ? "−" : "="}${count(row.quantity)} ${row.unit}`,
    reference: row.reference ?? "—",
    note: row.note ?? "",
  }));
}

/** Item options for stock movement and daily-record feed pickers. */
export type InventoryFormValues = {
  id: number;
  sku: string;
  name: string;
  category: string;
  subcategory: string | null;
  quantity: number;
  unit: string;
  unitCostCents: number;
  minStock: number;
  batch: string | null;
  expiryDate: string | null;
  supplierId: number | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getInventoryFormValues(): Promise<
  Map<number, InventoryFormValues>
> {
  const rows = await db
    .select({
      id: inventoryTable.id,
      sku: inventoryTable.sku,
      name: inventoryTable.name,
      category: inventoryTable.category,
      subcategory: inventoryTable.subcategory,
      quantity: inventoryTable.quantity,
      unit: inventoryTable.unit,
      unitCostCents: inventoryTable.unitCostCents,
      minStock: inventoryTable.minStock,
      batch: inventoryTable.batch,
      expiryDate: inventoryTable.expiryDate,
      supplierId: inventoryTable.supplierId,
    })
    .from(inventoryTable)
    .where(eq(inventoryTable.isActive, true));

  return new Map(rows.map((row) => [row.id, row]));
}

export async function getInventoryOptions(category?: InventoryCategory) {
  return db
    .select({
      id: inventoryTable.id,
      name: inventoryTable.name,
      sku: inventoryTable.sku,
      unit: inventoryTable.unit,
      quantity: inventoryTable.quantity,
      batch: inventoryTable.batch,
    })
    .from(inventoryTable)
    .where(
      category
        ? and(eq(inventoryTable.isActive, true), eq(inventoryTable.category, category))
        : eq(inventoryTable.isActive, true),
    )
    .orderBy(asc(inventoryTable.name));
}
