import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  inventoryItems,
  inventoryMovements,
  suppliers,
} from "@/lib/db/schema";

import {
  axis,
  count,
  daysBetween,
  DONUT_COLORS,
  formatDate,
  money,
  recentMonths,
} from "./common";
import { getFarmSettings } from "./settings";

/**
 * Medicines are inventory items in the `medicine` category; this board is the
 * veterinary view of that register, keyed on expiry rather than value.
 */
const IS_MEDICINE = and(
  eq(inventoryItems.category, "medicine"),
  eq(inventoryItems.isActive, true),
);

/** Units issued per month, which is what the usage chart plots. */
export async function getMedicineUsage(months = 6) {
  const range = recentMonths(months);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${inventoryMovements.occurredOn}), 'YYYY-MM')`,
      issued: sql<number>`coalesce(sum(${inventoryMovements.quantity}), 0)::int`,
    })
    .from(inventoryMovements)
    .innerJoin(inventoryItems, eq(inventoryItems.id, inventoryMovements.itemId))
    .where(
      and(
        eq(inventoryItems.category, "medicine"),
        eq(inventoryMovements.type, "stock_out"),
        sql`${inventoryMovements.occurredOn} >= date_trunc('month', current_date) - make_interval(months => ${months - 1})`,
      ),
    )
    .groupBy(sql`date_trunc('month', ${inventoryMovements.occurredOn})`);

  const byMonth = new Map(rows.map((row) => [row.month, row.issued]));
  const values = range.map((entry) => byMonth.get(entry.key) ?? 0);
  const { max, ticks } = axis(Math.max(...values, 1));

  return { labels: range.map((entry) => entry.label), ticks, max, values };
}

/** Item counts per medicine subcategory (vaccines, antibiotics, …). */
export async function getStockByCategory() {
  const rows = await db
    .select({
      subcategory: sql<string>`coalesce(${inventoryItems.subcategory}, 'Other')`,
      total: sql<number>`count(*)::int`,
    })
    .from(inventoryItems)
    .where(IS_MEDICINE)
    .groupBy(sql`coalesce(${inventoryItems.subcategory}, 'Other')`)
    .orderBy(desc(sql`count(*)`));

  return rows.map((row, index) => ({
    name: row.subcategory,
    value: row.total,
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: count(row.total),
  }));
}

export type MedicineRow = {
  id: number;
  name: string;
  supplier: string;
  category: string;
  quantity: string;
  /** Tints the quantity when the batch is low or below minimum. */
  quantityTone?: Tone;
  unit: string;
  batch: string;
  expiry: string;
  expiryNote: string;
  unitCost: string;
  status: string;
  statusTone: Tone;
};

export type MedicineFilters = {
  search?: string;
  subcategory?: string;
  supplier?: string;
};

export async function getMedicines(
  filters: MedicineFilters = {},
): Promise<MedicineRow[]> {
  const settings = await getFarmSettings();
  const conditions = [IS_MEDICINE];

  if (filters.subcategory) {
    conditions.push(eq(inventoryItems.subcategory, filters.subcategory));
  }
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
      quantity: inventoryItems.quantity,
      unit: inventoryItems.unit,
      unitCostCents: inventoryItems.unitCostCents,
      minStock: inventoryItems.minStock,
      batch: inventoryItems.batch,
      expiryDate: inventoryItems.expiryDate,
      supplierName: suppliers.name,
    })
    .from(inventoryItems)
    .leftJoin(suppliers, eq(suppliers.id, inventoryItems.supplierId))
    .where(and(...conditions))
    .orderBy(
      // Whatever expires first needs attention first; undated items sink.
      sql`${inventoryItems.expiryDate} asc nulls last`,
      inventoryItems.name,
    );

  return rows.map((row) => {
    const daysLeft = row.expiryDate ? daysBetween(new Date(), row.expiryDate) : null;
    const expiring =
      daysLeft !== null && daysLeft <= settings.medicineExpiryWarningDays;
    const expired = daysLeft !== null && daysLeft < 0;
    const belowMinimum = row.quantity < row.minStock;
    const nearMinimum = !belowMinimum && row.quantity <= row.minStock * 1.1;

    let status = "In stock";
    let statusTone: Tone = "success";
    if (expired) {
      status = "Expired";
      statusTone = "error";
    } else if (expiring && belowMinimum) {
      status = "Expiring · low";
      statusTone = "error";
    } else if (belowMinimum) {
      status = "Below minimum";
      statusTone = "error";
    } else if (expiring) {
      status = "Expiring soon";
      statusTone = "warning";
    } else if (nearMinimum) {
      status = "Reorder soon";
      statusTone = "warning";
    }

    return {
      id: row.id,
      name: row.name,
      supplier: row.supplierName ?? "—",
      category: row.subcategory ?? "Other",
      quantity: count(row.quantity),
      quantityTone: belowMinimum ? "error" : nearMinimum ? "warning" : undefined,
      unit: row.unit,
      batch: row.batch ?? "—",
      expiry: row.expiryDate ? formatDate(row.expiryDate) : "—",
      expiryNote:
        daysLeft === null
          ? "No expiry"
          : daysLeft < 0
            ? `Expired ${Math.abs(daysLeft)} days ago`
            : `${daysLeft} days left`,
      unitCost: money(row.unitCostCents),
      status,
      statusTone,
    };
  });
}

export async function getMedicineKpis() {
  const settings = await getFarmSettings();

  const [row] = await db
    .select({
      items: sql<number>`count(*)::int`,
      value: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitCostCents}), 0)::bigint`,
      belowMinimum: sql<number>`count(*) filter (where ${inventoryItems.quantity} < ${inventoryItems.minStock})::int`,
      expiring: sql<number>`count(*) filter (where ${inventoryItems.expiryDate} is not null and ${inventoryItems.expiryDate} between current_date and current_date + ${settings.medicineExpiryWarningDays}::int)::int`,
      expired: sql<number>`count(*) filter (where ${inventoryItems.expiryDate} is not null and ${inventoryItems.expiryDate} < current_date)::int`,
    })
    .from(inventoryItems)
    .where(IS_MEDICINE);

  return {
    items: row.items,
    totalValue: Number(row.value),
    totalValueLabel: money(Number(row.value)),
    belowMinimum: row.belowMinimum,
    expiring: row.expiring,
    expired: row.expired,
    warningDays: settings.medicineExpiryWarningDays,
  };
}
