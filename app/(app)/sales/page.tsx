import {
  Banknote,
  CalendarDays,
  CreditCard,
  ReceiptText,
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
import { OrderDialog } from "@/components/dialogs/sales-dialogs";
import { RangeSelect } from "@/components/ui/range-select";
import { numberParam } from "@/lib/pagination";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { getProductOptions } from "@/lib/data/products";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  type Column,
} from "@/components/ui/data-table";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  getCustomerOptions,
  getTopCustomers,
} from "@/lib/data/customers";
import {
  getRecentOrders,
  getSalesByProduct,
  getSalesKpis,
  getSalesTrend,
  type RecentOrderRow,
} from "@/lib/data/sales";
import { count, money, signedPercent } from "@/lib/format";

const columns: Column<RecentOrderRow>[] = [
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

export default async function SalesPage({
  searchParams,
}: PageProps<"/sales">) {
  const params = await searchParams;
  const months = numberParam(params, "months", 8, { min: 1, max: 60 });
  const [
    kpis,
    salesTrend,
    salesByProduct,
    recentOrders,
    topCustomers,
    customers,
    products,
  ] = await Promise.all([
    getSalesKpis(),
    getSalesTrend(months),
    getSalesByProduct(),
    getRecentOrders(),
    getTopCustomers(),
    getCustomerOptions(),
    getProductOptions(),
  ]);

  const trendSeries = [
    { name: "Revenue", color: chartColors.primary, values: salesTrend.revenue },
    { name: "Target", color: "#DDD6FE", values: salesTrend.target },
  ];
  const productRevenue = salesByProduct.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );

  return (
    <>
      <PageHeader
        title="Sales Overview"
        breadcrumb={["Sales"]}
        subtitle="Revenue performance, orders and receivables at a glance."
      >
        <ExportButton board="orders" />
        <OrderDialog customers={customers} products={products} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Today's Sales"
          icon={CalendarDays}
          value={kpis.todayLabel}
          delta={signedPercent(kpis.todayChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.todayChangePct >= 0 ? "success" : "warning"}
          note={`${kpis.ordersToday} order${
            kpis.ordersToday === 1 ? "" : "s"
          } today`}
        />
        <KpiCard
          label="Monthly Sales"
          icon={Banknote}
          value={kpis.monthLabel}
          delta={signedPercent(kpis.monthChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.monthChangePct >= 0 ? "success" : "warning"}
          note="vs last month"
        />
        <KpiCard
          label="Orders"
          icon={ReceiptText}
          value={count(kpis.ordersThisMonth)}
          delta={
            kpis.ordersChange >= 0
              ? `+${kpis.ordersChange}`
              : String(kpis.ordersChange)
          }
          deltaIcon={TrendingUp}
          deltaTone={kpis.ordersChange >= 0 ? "success" : "warning"}
          note="this month"
        />
        <KpiCard
          label="Outstanding Payments"
          icon={CreditCard}
          iconTone={kpis.unpaidOrders ? "warning" : undefined}
          value={kpis.outstandingLabel}
          delta={kpis.unpaidOrders ? "Chase" : "Settled"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.unpaidOrders ? "warning" : "success"}
          note={`${kpis.unpaidOrders} invoice${
            kpis.unpaidOrders === 1 ? "" : "s"
          }`}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Sales Trend"
            subtitle="Revenue vs target · last 8 months · ₵ thousands"
          >
            <RangeSelect
              name="months"
              defaultValue="8"
              options={[
                { value: "3", label: "Last 3 months" },
                { value: "6", label: "Last 6 months" },
                { value: "8", label: "Last 8 months" },
                { value: "12", label: "Last 12 months" },
              ]}
            />
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
              caption={money(productRevenue / 100, { compact: true })}
              captionLabel="revenue"
            />
            <DonutLegend slices={salesByProduct} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex min-w-0 flex-1 flex-col">
          <PanelHead
            inset
            title="Recent Orders"
            subtitle={`Last ${recentOrders.length} orders`}
          />
          <DataTable
            columns={columns}
            rows={recentOrders}
            rowKey={(row) => String(row.id)}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead
            title="Top Customers"
            subtitle="By revenue · last 30 days"
          />
          <ul className="flex flex-col gap-3.5">
            {topCustomers.map((customer) => (
              <li key={customer.id} className="flex flex-col gap-2">
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
