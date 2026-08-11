import {
  Banknote,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Download,
  Plus,
  Receipt,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { ProgressRail } from "@/components/charts/progress-rail";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  type Column,
} from "@/components/ui/data-table";
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  recentOrders,
  salesByProduct,
  salesTrend,
  topCustomers,
  type RecentOrder,
} from "@/lib/data/sales";

const trendSeries = [
  { name: "Revenue", color: chartColors.primary, values: salesTrend.revenue },
  { name: "Target", color: "#DDD6FE", values: salesTrend.target },
];

const columns: Column<RecentOrder>[] = [
  {
    header: "ORDER",
    width: 124,
    cell: (row) => <CellStack primary={row.reference} secondary={row.summary} />,
  },
  {
    header: "CUSTOMER",
    cell: (row) => <CellText>{row.customer}</CellText>,
  },
  {
    header: "TOTAL",
    width: 100,
    cell: (row) => <CellText strong>{row.total}</CellText>,
  },
  {
    header: "PAYMENT",
    width: 120,
    cell: (row) => <Badge tone={row.paymentTone}>{row.payment}</Badge>,
  },
  {
    header: "STATUS",
    width: 120,
    cell: (row) => (
      <Badge tone={row.statusTone} dot={row.statusDot ?? true}>
        {row.status}
      </Badge>
    ),
  },
];

export default function SalesPage() {
  return (
    <>
      <PageHeader
        title="Sales Overview"
        breadcrumb={["Sales"]}
        subtitle="Revenue performance, orders and receivables at a glance."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Create Order</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Today's Sales"
          icon={CalendarDays}
          value="$1,240"
          delta="+18%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="8 orders today"
        />
        <KpiCard
          label="Monthly Sales"
          icon={Banknote}
          value="$24,820"
          delta="+12.4%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Orders"
          icon={Receipt}
          value="162"
          delta="+14"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="this month"
        />
        <KpiCard
          label="Outstanding Payments"
          icon={CreditCard}
          iconTone="warning"
          value="$7,840"
          delta="Chase"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="9 invoices"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Sales Trend"
            subtitle="Revenue vs target · last 8 months · $ thousands"
          >
            <GhostButton icon={ChevronDown}>Last 8 months</GhostButton>
          </PanelHead>
          <ChartLegend series={trendSeries} />
          <BarChart
            labels={salesTrend.labels}
            ticks={salesTrend.ticks}
            max={salesTrend.max}
            height={150}
            series={trendSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Sales by Product" subtitle="Last 30 days" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={salesByProduct}
              size={150}
              caption="$24.8k"
              captionLabel="revenue"
            />
            <DonutLegend slices={salesByProduct} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex min-w-0 flex-1 flex-col">
          <PanelHead inset title="Recent Orders" subtitle="Last 6 orders" />
          <DataTable
            columns={columns}
            rows={recentOrders}
            rowKey={(row) => row.reference}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead
            title="Top Customers"
            subtitle="By revenue · last 30 days"
          />
          <ul className="flex flex-col gap-3.5">
            {topCustomers.map((customer) => (
              <li key={customer.name} className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={customer.initials} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm-plus font-medium text-ink">
                    {customer.name}
                  </span>
                  <span className="text-sm-plus font-semibold text-ink">
                    {customer.revenue}
                  </span>
                </div>
                <ProgressRail value={customer.share} height={6} />
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
