import "server-only";

import { eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { expenses, inventoryItems, payments, suppliers } from "@/lib/db/schema";

import {
  DONUT_COLORS,
  EXPENSE_CATEGORY,
  axis,
  compactTick,
  money,
  recentMonths,
} from "./common";
import { getInvoicedByMonth, RECEIVABLES } from "./revenue";

/**
 * Revenue, expenses and the profit between them, per month. Everything the
 * finance board plots comes off this one pair of ledgers so the three series
 * always reconcile.
 */
export async function getRevenueVsExpenses(months = 8) {
  const range = recentMonths(months);
  const since = sql.raw(`interval '${months - 1} months'`);

  const [revenueByMonth, expenseRows] = await Promise.all([
    getInvoicedByMonth(months),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${expenses.expenseDate}), 'YYYY-MM')`,
        total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::bigint`,
      })
      .from(expenses)
      .where(
        sql`${expenses.status} <> 'rejected' and ${expenses.expenseDate} >= date_trunc('month', current_date) - ${since}`,
      )
      .groupBy(sql`date_trunc('month', ${expenses.expenseDate})`),
  ]);

  const expenseByMonth = new Map(
    expenseRows.map((row) => [row.month, Number(row.total)]),
  );

  const dollars = (cents: number) => Math.round(cents / 100);
  const revenue = range.map((entry) =>
    dollars(revenueByMonth.get(entry.key) ?? 0),
  );
  const expense = range.map((entry) =>
    dollars(expenseByMonth.get(entry.key) ?? 0),
  );
  const profit = revenue.map((value, index) => value - expense[index]);

  const compact = compactTick;
  const { max, ticks } = axis(Math.max(...revenue, ...expense, 1), 4, compact);

  return {
    labels: range.map((entry) => entry.label),
    ticks,
    max,
    revenue,
    expenses: expense,
    profit,
  };
}

export async function getMonthlyProfit(months = 8) {
  const chart = await getRevenueVsExpenses(months);
  const compact = compactTick;
  const { max, ticks } = axis(Math.max(...chart.profit, 1), 4, compact);

  return { labels: chart.labels, ticks, max, values: chart.profit };
}

export async function getExpensesByCategory(months = 1) {
  const rows = await db
    .select({
      category: expenses.category,
      total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)::bigint`,
    })
    .from(expenses)
    .where(
      sql`${expenses.status} <> 'rejected' and ${expenses.expenseDate} >= date_trunc('month', current_date) - ${sql.raw(
        `interval '${months - 1} months'`,
      )}`,
    )
    .groupBy(expenses.category)
    .orderBy(sql`coalesce(sum(${expenses.amountCents}), 0) desc`);

  return rows.map((row, index) => ({
    name: EXPENSE_CATEGORY[row.category] ?? row.category,
    value: Number(row.total),
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: money(Number(row.total)),
  }));
}

export type CashLine = {
  label: string;
  value: string;
  icon: "wallet" | "credit-card" | "file-minus" | "package";
  /** Tints the amount; omitted for neutral balances. */
  tone?: Tone;
};

/**
 * The working-capital panel. Cash on hand is not a stored balance, so it is
 * derived: everything collected less everything paid out.
 */
export async function getCashPosition() {
  const [[collected], [paidOut], [receivable], [payables], [stock]] =
    await Promise.all([
      db
        .select({
          total: sql<number>`coalesce(sum(${payments.amountCents}), 0)::bigint`,
        })
        .from(payments),
      db
        .select({
          total: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.status} = 'approved'), 0)::bigint`,
        })
        .from(expenses),
      db.select({ total: RECEIVABLES }).from(sql`(select 1) as one`),
      db
        .select({
          total: sql<number>`coalesce(sum(${suppliers.outstandingCents}), 0)::bigint`,
        })
        .from(suppliers),
      db
        .select({
          total: sql<number>`coalesce(sum(${inventoryItems.quantity} * ${inventoryItems.unitCostCents}), 0)::bigint`,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.isActive, true)),
    ]);

  const cash = Number(collected.total) - Number(paidOut.total);
  const receivables = Number(receivable.total);
  const payable = Number(payables.total);
  const inventoryValue = Number(stock.total);

  const lines: CashLine[] = [
    { label: "Cash & bank", value: money(cash), icon: "wallet" },
    {
      label: "Receivables",
      value: money(receivables),
      icon: "credit-card",
      tone: receivables > 0 ? "warning" : undefined,
    },
    {
      label: "Payables",
      value: `-${money(payable)}`,
      icon: "file-minus",
      tone: payable > 0 ? "error" : undefined,
    },
    { label: "Inventory value", value: money(inventoryValue), icon: "package" },
  ];

  const working = cash + receivables + inventoryValue - payable;

  return { lines, workingCapital: money(working), workingCapitalCents: working };
}

export async function getFinanceKpis() {
  const [revenueByMonth, [spend]] = await Promise.all([
    getInvoicedByMonth(2),
    db
      .select({
        month: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= date_trunc('month', current_date)), 0)::bigint`,
        lastMonth: sql<number>`coalesce(sum(${expenses.amountCents}) filter (where ${expenses.expenseDate} >= date_trunc('month', current_date) - interval '1 month' and ${expenses.expenseDate} < date_trunc('month', current_date)), 0)::bigint`,
      })
      .from(expenses)
      .where(sql`${expenses.status} <> 'rejected'`),
  ]);

  const months = [...revenueByMonth.keys()].sort();
  const revenueNow = revenueByMonth.get(months.at(-1) ?? "") ?? 0;
  const revenueBefore =
    months.length > 1 ? (revenueByMonth.get(months.at(-2)!) ?? 0) : 0;
  const spendNow = Number(spend.month);
  const spendBefore = Number(spend.lastMonth);
  const profit = revenueNow - spendNow;
  const profitBefore = revenueBefore - spendBefore;
  const margin = revenueNow > 0 ? (profit / revenueNow) * 100 : 0;
  const marginBefore = revenueBefore > 0 ? (profitBefore / revenueBefore) * 100 : 0;

  const change = (current: number, previous: number) =>
    previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0;

  return {
    revenue: revenueNow,
    revenueLabel: money(revenueNow),
    revenueChangePct: change(revenueNow, revenueBefore),
    expenses: spendNow,
    expensesLabel: money(spendNow),
    expensesChangePct: change(spendNow, spendBefore),
    profit,
    profitLabel: money(profit),
    profitChangePct: change(profit, profitBefore),
    margin,
    marginChangePp: margin - marginBefore,
  };
}
