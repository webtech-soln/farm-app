import {
  Bird,
  Clock,
  Receipt,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Wheat,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { ProgressRail } from "@/components/charts/progress-rail";
import {
  DeleteExpenseDialog,
  ExpenseDialog,
  ExpenseStatusDialog,
} from "@/components/dialogs/finance-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { getSupplierOptions } from "@/lib/data/suppliers";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pager } from "@/components/ui/pager";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  getExpenseKpis,
  getExpenseTrend,
  getExpenses,
  getLargestExpenses,
  type ExpenseRow,
  getExpenseCategories,
  getExpenseFormValues,
  type ExpenseFormValues,
} from "@/lib/data/expenses";
import { percent, signedPercent } from "@/lib/format";

function buildColumns(
  suppliers: { id: number; name: string }[],
  formValues: Map<number, ExpenseFormValues>,
): Column<ExpenseRow>[] {
  return [
    {
      header: "DATE",
      cell: (row) => <CellStack primary={row.date} secondary={row.recordedBy} />,
    },
    {
      header: "DESCRIPTION",
      width: 240,
      cell: (row) => (
        <span className="block truncate text-sm-plus font-medium text-ink">
          {row.description}
        </span>
      ),
    },
    {
      header: "CATEGORY",
      width: 120,
      cell: (row) => <CellText>{row.category}</CellText>,
      hideBelow: "md",
    },
    {
      header: "AMOUNT",
      width: 100,
      cell: (row) => <CellText strong>{row.amount}</CellText>,
    },
    {
      header: "SUPPLIER",
      width: 160,
      cell: (row) => <CellText>{row.supplier}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "PAYMENT",
      width: 120,
      cell: (row) => <CellText>{row.payment}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 120,
      cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
    },
    {
      header: "",
      width: 100,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <ExpenseStatusDialog id={row.id} status={row.statusKey} />
          <ExpenseDialog suppliers={suppliers} expense={formValues.get(row.id)} />
          <DeleteExpenseDialog id={row.id} description={row.description} />
        </div>
      ),
    },
  ];
}

export default async function ExpensesPage({
  searchParams,
}: PageProps<"/expenses">) {
  const params = await searchParams;
  const window = pageWindow(params);
  const filters = {
    search: param(params, "q"),
    category: param(params, "category"),
    supplier: param(params, "supplier"),
    status: param(params, "status"),
  };

  const [kpis, expenseTrend, largestExpenses, rows, suppliers, formValues] =
    await Promise.all([
    getExpenseKpis(),
    getExpenseTrend(),
    getLargestExpenses(),
    getExpenses(filters, window.limit, window.offset),
    getSupplierOptions(),
    getExpenseFormValues(),
  ]);

  const expenses = paginate(rows, window);
  const columns = buildColumns(suppliers, formValues);

  const trendSeries = [
    { name: "Feed", color: chartColors.primary, values: expenseTrend.feed },
    { name: "Labour", color: "#A78BFA", values: expenseTrend.labour },
    { name: "Other", color: "#DDD6FE", values: expenseTrend.other },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        breadcrumb={["Finance", "Expenses"]}
        subtitle="Every cost recorded against the farm, by category and supplier."
      >
        <ExportButton board="expenses" />
        <ExpenseDialog suppliers={suppliers} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total (month)"
          icon={Receipt}
          value={kpis.monthLabel}
          delta={signedPercent(kpis.monthChangePct)}
          deltaIcon={kpis.monthChangePct >= 0 ? TrendingUp : TrendingDown}
          deltaTone={kpis.monthChangePct > 0 ? "error" : "success"}
          note="vs last month"
        />
        <KpiCard
          label="Feed Spend"
          icon={Wheat}
          value={kpis.feedLabel}
          delta={percent(kpis.feedSharePct, 0)}
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="of total spend"
        />
        <KpiCard
          label="Cost per Bird"
          icon={Bird}
          value={kpis.costPerBirdLabel}
          delta="This month"
          deltaIcon={TrendingDown}
          deltaTone="neutral"
          note="spend ÷ live birds"
        />
        <KpiCard
          label="Pending Approval"
          icon={Clock}
          iconTone={kpis.pending ? "warning" : undefined}
          value={`${kpis.pending} item${kpis.pending === 1 ? "" : "s"}`}
          delta={kpis.pending ? "Review" : "Clear"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.pending ? "warning" : "success"}
          note={`${kpis.pendingValueLabel} total`}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Expense Trend by Category"
            subtitle="Last 6 months · $ thousands"
          >
            <ChartLegend series={trendSeries} />
          </PanelHead>
          <BarChart
            labels={expenseTrend.labels}
            ticks={expenseTrend.ticks}
            max={expenseTrend.max}
            height={150}
            barWidth={14}
            series={trendSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Largest Expenses" subtitle="This month" />
          <ul className="flex flex-col gap-3.5">
            {largestExpenses.map((line) => (
              <li key={line.id} className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm-plus font-medium text-ink">
                      {line.name}
                    </span>
                    <span className="truncate text-xs text-ink-3">
                      {line.source}
                    </span>
                  </div>
                  <span className="text-sm-plus font-semibold text-ink">
                    {line.amount}
                  </span>
                </div>
                <ProgressRail value={line.share} height={6} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <FilterBar
        placeholder="Search description or supplier…"
        filters={[
          { name: "category", label: "Category", options: getExpenseCategories() },
          {
            name: "supplier",
            label: "Supplier",
            options: suppliers.map((supplier) => ({
              value: supplier.name,
              label: supplier.name,
            })),
          },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pending" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Expense Records" />
        <DataTable
          columns={columns}
          rows={expenses.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${expenses.range} expenses`}>
          <Pager
            page={expenses.page}
            hasNext={expenses.hasNext}
            hasPrevious={expenses.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
