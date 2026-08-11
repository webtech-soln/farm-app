import {
  Bird,
  Clock,
  Download,
  Plus,
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
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  expenseTrend,
  expenses,
  largestExpenses,
  type Expense,
} from "@/lib/data/expenses";

const trendSeries = [
  { name: "Feed", color: chartColors.primary, values: expenseTrend.feed },
  { name: "Labour", color: "#A78BFA", values: expenseTrend.labour },
  { name: "Other", color: "#DDD6FE", values: expenseTrend.other },
];

const columns: Column<Expense>[] = [
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
];

export default function ExpensesPage() {
  return (
    <>
      <PageHeader
        title="Expenses"
        breadcrumb={["Finance", "Expenses"]}
        subtitle="Every cost recorded against the farm, by category and supplier."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Expense</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total (month)"
          icon={Receipt}
          value="$16,450"
          delta="+4.2%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last month"
        />
        <KpiCard
          label="Feed Spend"
          icon={Wheat}
          value="$6,251"
          delta="+3.1%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="38% of total"
        />
        <KpiCard
          label="Cost per Bird"
          icon={Bird}
          value="$0.66"
          delta="↓ 2.4%"
          deltaIcon={TrendingDown}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Pending Approval"
          icon={Clock}
          iconTone="warning"
          value="4 items"
          delta="Review"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="$2,180 total"
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
              <li key={line.name} className="flex flex-col gap-2">
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
        selects={["Category", "Supplier", "Payment method", "Date range"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Expense Records" />
        <DataTable
          columns={columns}
          rows={expenses}
          rowKey={(row) => row.date + row.description}
        />
        <TableFooter summary="Showing 6 of 214 expenses">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
