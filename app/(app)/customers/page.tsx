import {
  CreditCard,
  Download,
  Plus,
  Receipt,
  TrendingUp,
  TriangleAlert,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
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
import { toneText } from "@/components/ui/tone";
import {
  customerMix,
  customers,
  revenueByType,
  type Customer,
} from "@/lib/data/customers";

const mixSeries = [
  {
    name: "Returning",
    color: chartColors.primary,
    values: customerMix.returning,
  },
  { name: "New", color: chartColors.soft, values: customerMix.fresh },
];

const columns: Column<Customer>[] = [
  {
    header: "CUSTOMER",
    cell: (row) => <CellStack primary={row.name} secondary={row.descriptor} />,
  },
  {
    header: "TYPE",
    width: 120,
    cell: (row) => <CellText>{row.type}</CellText>,
    hideBelow: "md",
  },
  {
    header: "ORDERS",
    width: 80,
    cell: (row) => <CellText strong>{row.orders}</CellText>,
  },
  {
    header: "TOTAL PURCHASES",
    width: 130,
    cell: (row) => <CellText strong>{row.purchases}</CellText>,
  },
  {
    header: "OUTSTANDING",
    width: 120,
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${
          row.outstandingTone ? toneText[row.outstandingTone] : "text-ink-2"
        }`}
      >
        {row.outstanding}
      </span>
    ),
  },
  {
    header: "LAST PURCHASE",
    width: 130,
    cell: (row) => <CellText>{row.lastPurchase}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "STATUS",
    width: 110,
    cell: (row) => (
      <Badge tone={row.statusTone} dot={row.statusDot ?? true}>
        {row.status}
      </Badge>
    ),
  },
];

export default function CustomersPage() {
  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumb={["Sales", "Customers"]}
        subtitle="Buyers, balances and purchase history."
      >
        <Button variant="secondary" icon={Upload}>
          Import
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Customer</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Customers"
          icon={Users}
          value="64"
          delta="+8.5%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="5 new this month"
        />
        <KpiCard
          label="Active This Month"
          icon={UserCheck}
          value="41"
          delta="+3"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="64% of base"
        />
        <KpiCard
          label="Outstanding"
          icon={CreditCard}
          iconTone="warning"
          value="$7,840"
          delta="Chase"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="9 invoices unpaid"
        />
        <KpiCard
          label="Avg Order Value"
          icon={Receipt}
          value="$312"
          delta="+4.6%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="New vs Returning Customers"
            subtitle="Orders per month · last 8 months"
          >
            <ChartLegend series={mixSeries} />
          </PanelHead>
          <BarChart
            labels={customerMix.labels}
            ticks={customerMix.ticks}
            max={customerMix.max}
            height={150}
            series={mixSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Revenue by Customer Type" subtitle="Last 30 days" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={revenueByType}
              size={150}
              caption="$24.8k"
              captionLabel="revenue"
            />
            <DonutLegend slices={revenueByType} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search customer name or phone…"
        selects={["Type", "Status", "Balance", "Last purchase"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="All Customers" />
        <DataTable
          columns={columns}
          rows={customers}
          rowKey={(row) => row.name}
        />
        <TableFooter summary="Showing 6 of 64 customers">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
