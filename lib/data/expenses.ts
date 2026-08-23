import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { expenses as table, flocks, suppliers, users } from "@/lib/db/schema";

import {
  APPROVAL_STATUS,
  EXPENSE_CATEGORY,
  PAYMENT_METHOD,
  axis,
  compactTick,
  display,
  formatDate,
  money,
  recentMonths,
  shortName,
} from "./common";

/** Rejected expenses are excluded everywhere: they never became spend. */
const BOOKED = sql`${table.status} <> 'rejected'`;

/** Monthly spend split into feed, labour and everything else. */
export async function getExpenseTrend(months = 6) {
  const range = recentMonths(months);

  const rows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${table.expenseDate}), 'YYYY-MM')`,
      feed: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.category} = 'feed'), 0)::bigint`,
      labour: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.category} = 'labour'), 0)::bigint`,
      other: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.category} not in ('feed','labour')), 0)::bigint`,
    })
    .from(table)
    .where(
      sql`${BOOKED} and ${table.expenseDate} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .groupBy(sql`date_trunc('month', ${table.expenseDate})`);

  const byMonth = new Map(rows.map((row) => [row.month, row]));
  const dollars = (value: number | undefined) => Math.round(Number(value ?? 0) / 100);

  const feed = range.map((entry) => dollars(byMonth.get(entry.key)?.feed));
  const labour = range.map((entry) => dollars(byMonth.get(entry.key)?.labour));
  const other = range.map((entry) => dollars(byMonth.get(entry.key)?.other));

  const totals = range.map(
    (_, index) => feed[index] + labour[index] + other[index],
  );
  const { max, ticks } = axis(Math.max(...totals, 1), 4, compactTick,
  );

  return { labels: range.map((entry) => entry.label), ticks, max, feed, labour, other };
}

export type LargestExpense = {
  id: number;
  name: string;
  source: string;
  amount: string;
  /** Bar length relative to the largest line, 0–100. */
  share: number;
};

export async function getLargestExpenses(
  limit = 5,
  months = 1,
): Promise<LargestExpense[]> {
  const rows = await db
    .select({
      id: table.id,
      description: table.description,
      amountCents: table.amountCents,
      category: table.category,
      supplierName: suppliers.name,
    })
    .from(table)
    .leftJoin(suppliers, eq(suppliers.id, table.supplierId))
    .where(
      sql`${BOOKED} and ${table.expenseDate} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .orderBy(desc(table.amountCents))
    .limit(limit);

  const top = rows[0]?.amountCents ?? 0;

  return rows.map((row) => ({
    id: row.id,
    name: row.description,
    source:
      row.supplierName ?? (EXPENSE_CATEGORY[row.category] ?? row.category),
    amount: money(row.amountCents),
    share: top > 0 ? Math.round((row.amountCents / top) * 100) : 0,
  }));
}

export type ExpenseRow = {
  id: number;
  date: string;
  recordedBy: string;
  description: string;
  category: string;
  amount: string;
  supplier: string;
  payment: string;
  status: string;
  statusTone: Tone;
  /** Raw enum value, for the row actions. */
  statusKey: string;
};

export type ExpenseFilters = {
  search?: string;
  category?: string;
  supplier?: string;
  status?: string;
  days?: number;
};

export async function getExpenses(
  filters: ExpenseFilters = {},
  limit = 50,
  offset = 0,
): Promise<ExpenseRow[]> {
  const conditions = [];

  if (filters.category) {
    conditions.push(sql`${table.category}::text = ${filters.category}`);
  }
  if (filters.status) {
    conditions.push(sql`${table.status}::text = ${filters.status}`);
  }
  if (filters.supplier) conditions.push(eq(suppliers.name, filters.supplier));
  if (filters.days) {
    conditions.push(sql`${table.expenseDate} >= current_date - ${filters.days}::int`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${table.description}) like ${term} or lower(coalesce(${suppliers.name}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      expenseDate: table.expenseDate,
      description: table.description,
      category: table.category,
      amountCents: table.amountCents,
      method: table.method,
      status: table.status,
      supplierName: suppliers.name,
      recordedBy: users.name,
    })
    .from(table)
    .leftJoin(suppliers, eq(suppliers.id, table.supplierId))
    .leftJoin(users, eq(users.id, table.recordedById))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(table.expenseDate), desc(table.id))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(APPROVAL_STATUS, row.status);
    return {
      id: row.id,
      date: formatDate(row.expenseDate),
      recordedBy: `Recorded by ${shortName(row.recordedBy)}`,
      description: row.description,
      category: EXPENSE_CATEGORY[row.category] ?? row.category,
      amount: money(row.amountCents),
      supplier: row.supplierName ?? "—",
      payment: PAYMENT_METHOD[row.method] ?? row.method,
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusKey: row.status,
    };
  });
}

export async function getExpenseKpis() {
  const [[spend], [birds]] = await Promise.all([
    db
      .select({
        month: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.expenseDate} >= date_trunc('month', current_date) and ${table.status} <> 'rejected'), 0)::bigint`,
        lastMonth: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.expenseDate} >= date_trunc('month', current_date) - interval '1 month' and ${table.expenseDate} < date_trunc('month', current_date) and ${table.status} <> 'rejected'), 0)::bigint`,
        feedMonth: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.category} = 'feed' and ${table.expenseDate} >= date_trunc('month', current_date) and ${table.status} <> 'rejected'), 0)::bigint`,
        pending: sql<number>`count(*) filter (where ${table.status} = 'pending')::int`,
        pendingValue: sql<number>`coalesce(sum(${table.amountCents}) filter (where ${table.status} = 'pending'), 0)::bigint`,
      })
      .from(table),
    db
      .select({
        total: sql<number>`coalesce(sum(${flocks.currentCount}), 0)::int`,
      })
      .from(flocks)
      .where(sql`${flocks.status} <> 'closed'`),
  ]);

  const month = Number(spend.month);
  const lastMonth = Number(spend.lastMonth);
  const feed = Number(spend.feedMonth);
  // Cost per bird only means anything while there are birds on the farm.
  const perBird = birds.total > 0 ? month / birds.total : 0;

  return {
    month,
    monthLabel: money(month),
    monthChangePct: lastMonth > 0 ? ((month - lastMonth) / lastMonth) * 100 : 0,
    feed,
    feedLabel: money(feed),
    feedSharePct: month > 0 ? (feed / month) * 100 : 0,
    costPerBird: perBird,
    costPerBirdLabel: money(Math.round(perBird)),
    pending: spend.pending,
    pendingValue: Number(spend.pendingValue),
    pendingValueLabel: money(Number(spend.pendingValue)),
  };
}

export type ExpenseFormValues = {
  id: number;
  expenseDate: string;
  description: string;
  category: string;
  amountCents: number;
  supplierId: number | null;
  method: string;
  status: string;
  notes: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getExpenseFormValues(): Promise<
  Map<number, ExpenseFormValues>
> {
  const rows = await db
    .select({
      id: table.id,
      expenseDate: table.expenseDate,
      description: table.description,
      category: table.category,
      amountCents: table.amountCents,
      supplierId: table.supplierId,
      method: table.method,
      status: table.status,
      notes: table.notes,
    })
    .from(table);

  return new Map(rows.map((row) => [row.id, row]));
}

export function getExpenseCategories() {
  return Object.entries(EXPENSE_CATEGORY).map(([value, label]) => ({
    value,
    label,
  }));
}
