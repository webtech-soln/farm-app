import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  expenses,
  inventoryItems,
  inventoryMovements,
  suppliers as table,
} from "@/lib/db/schema";

import {
  axis,
  count,
  display,
  DONUT_COLORS,
  money,
  SUPPLIER_STATUS,
} from "./common";

/**
 * Spend is what the farm has actually booked against a supplier: the expense
 * ledger is the source, since a stock receipt without an invoice is not money
 * spent yet.
 */
export async function getSpendBySupplier(months = 12, top = 6) {
  const rows = await db
    .select({
      name: table.name,
      spend: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::bigint`,
    })
    .from(expenses)
    .innerJoin(table, eq(table.id, expenses.supplierId))
    .where(
      sql`${expenses.expenseDate} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .groupBy(table.name)
    .orderBy(desc(sql`sum(${expenses.amountCents})`));

  const ranked = rows.map((row) => ({
    name: row.name,
    spend: Number(row.spend),
  }));
  const head = ranked.slice(0, top);
  const tail = ranked.slice(top);

  const entries = [...head];
  if (tail.length > 0) {
    entries.push({
      name: "Others",
      spend: tail.reduce((sum, row) => sum + row.spend, 0),
    });
  }

  const values = entries.map((entry) => Math.round(entry.spend / 100));
  const { max, ticks } = axis(Math.max(...values, 1), 4, (value) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : String(Math.round(value)),
  );

  return { labels: entries.map((entry) => entry.name), ticks, max, values };
}

/** How supplier balances are settled, for the donut. */
export async function getSupplierPaymentStatus() {
  const [row] = await db
    .select({
      paid: sql<number>`count(*) filter (where ${table.outstandingCents} = 0)::int`,
      partial: sql<number>`count(*) filter (where ${table.outstandingCents} > 0 and coalesce(${table.overdueDays}, 0) = 0)::int`,
      overdue: sql<number>`count(*) filter (where coalesce(${table.overdueDays}, 0) > 0)::int`,
    })
    .from(table);

  return [
    { name: "Paid in full", value: row.paid, color: DONUT_COLORS[0], display: count(row.paid) },
    {
      name: "Partially paid",
      value: row.partial,
      color: DONUT_COLORS[2],
      display: count(row.partial),
    },
    { name: "Overdue", value: row.overdue, color: "#DC2626", display: count(row.overdue) },
  ];
}

export type SupplierRow = {
  id: number;
  name: string;
  location: string;
  category: string;
  contact: string;
  products: string;
  purchases: string;
  outstanding: string;
  outstandingTone?: Tone;
  status: string;
  statusTone: Tone;
};

export type SupplierFilters = {
  search?: string;
  category?: string;
  status?: string;
};

export async function getSuppliers(
  filters: SupplierFilters = {},
): Promise<SupplierRow[]> {
  const conditions = [];

  if (filters.category) conditions.push(eq(table.category, filters.category));
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
      location: table.location,
      category: table.category,
      contact: table.contact,
      status: table.status,
      outstandingCents: table.outstandingCents,
      overdueDays: table.overdueDays,
      /*
       * `suppliers.id` is written out rather than interpolated: drizzle
       * renders a column reference unqualified, and a bare `id` inside these
       * subqueries would bind to the subquery's own table.
       */
      products: sql<number>`(
        select count(*)::int from inventory_items
        where inventory_items.supplier_id = suppliers.id and inventory_items.is_active
      )`,
      purchases: sql<number>`(
        select coalesce(sum(amount_cents), 0)::bigint from expenses
        where expenses.supplier_id = suppliers.id
      )`,
    })
    .from(table)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(
        sql`(select coalesce(sum(amount_cents), 0) from expenses where expenses.supplier_id = suppliers.id)`,
      ),
    );

  return rows.map((row) => {
    const statusDisplay = display(SUPPLIER_STATUS, row.status);
    const overdue = row.overdueDays ?? 0;
    const outstanding = row.outstandingCents ?? 0;

    return {
      id: row.id,
      name: row.name,
      location: row.location ?? "—",
      category: row.category ?? "—",
      contact: row.contact ?? "—",
      products: count(row.products),
      purchases: money(Number(row.purchases)),
      outstanding: money(outstanding),
      outstandingTone:
        outstanding === 0 ? undefined : overdue > 0 ? "error" : "warning",
      // An overdue balance is more useful on the badge than the bare status.
      status: overdue > 0 ? `Overdue ${overdue}d` : statusDisplay.label,
      statusTone: overdue > 0 ? "error" : statusDisplay.tone,
    };
  });
}

export async function getSupplierKpis() {
  const [[totals], [spend], [receipts]] = await Promise.all([
    db
      .select({
        active: sql<number>`count(*) filter (where ${table.status} = 'active')::int`,
        total: sql<number>`count(*)::int`,
        outstanding: sql<number>`coalesce(sum(${table.outstandingCents}), 0)::bigint`,
        overdueCount: sql<number>`count(*) filter (where coalesce(${table.overdueDays}, 0) > 0)::int`,
        dueCount: sql<number>`count(*) filter (where ${table.outstandingCents} > 0)::int`,
      })
      .from(table),
    db
      .select({
        thisMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= date_trunc('month', current_date)), 0)::bigint`,
        lastMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= date_trunc('month', current_date) - interval '1 month' and ${expenses.expenseDate} < date_trunc('month', current_date)), 0)::bigint`,
      })
      .from(expenses),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(inventoryMovements)
      .where(eq(inventoryMovements.type, "stock_in")),
  ]);

  const thisMonth = Number(spend.thisMonth);
  const lastMonth = Number(spend.lastMonth);

  return {
    active: totals.active,
    total: totals.total,
    purchasesThisMonth: thisMonth,
    purchasesLabel: money(thisMonth),
    purchasesChangePct:
      lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0,
    outstanding: Number(totals.outstanding),
    outstandingLabel: money(Number(totals.outstanding)),
    invoicesDue: totals.dueCount,
    overdueSuppliers: totals.overdueCount,
    receipts: receipts.total,
  };
}

/** Supplier picker options, active suppliers first. */
export type SupplierFormValues = {
  id: number;
  name: string;
  location: string | null;
  category: string | null;
  contact: string | null;
  email: string | null;
  status: string;
  outstandingCents: number;
  notes: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getSupplierFormValues(): Promise<
  Map<number, SupplierFormValues>
> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      location: table.location,
      category: table.category,
      contact: table.contact,
      email: table.email,
      status: table.status,
      outstandingCents: table.outstandingCents,
      notes: table.notes,
    })
    .from(table);

  return new Map(rows.map((row) => [row.id, row]));
}

export async function getSupplierOptions() {
  return db
    .select({ id: table.id, name: table.name, category: table.category })
    .from(table)
    .orderBy(sql`${table.status} = 'inactive'`, table.name);
}

export async function getSupplierCategories() {
  const rows = await db
    .selectDistinct({ category: table.category })
    .from(table)
    .where(sql`${table.category} is not null`)
    .orderBy(table.category);
  return rows.map((row) => row.category).filter((value): value is string => !!value);
}

/** Items supplied, used by the supplier detail drawer. */
export async function getSupplierItems(supplierId: number) {
  return db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      category: inventoryItems.category,
      quantity: inventoryItems.quantity,
      unit: inventoryItems.unit,
    })
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.supplierId, supplierId),
        eq(inventoryItems.isActive, true),
      ),
    )
    .orderBy(inventoryItems.name);
}
