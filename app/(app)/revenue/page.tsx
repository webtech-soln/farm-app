import {
  Banknote,
  CreditCard,
  ShoppingBag,
  Sprout,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PaymentDialog } from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { getCustomerOptions } from "@/lib/data/customers";
import { getOpenOrderOptions } from "@/lib/data/orders";
import { paginateAll, param } from "@/lib/pagination";
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
import { toneText } from "@/components/ui/tone";
import {
  getRevenueByStream,
  getRevenueEntries,
  getRevenueKpis,
  getRevenueTrend,
  type RevenueEntryRow,
} from "@/lib/data/revenue";
import { money, percent, signedPercent } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

function buildColumns(): Column<RevenueEntryRow>[] {
  return [
    {
      header: "DATE",
      cell: (row) => <CellStack primary={row.date} secondary={row.reference} />,
    },
    {
      header: "DESCRIPTION",
      width: 250,
      cell: (row) => (
        <span className="block truncate text-sm-plus font-medium text-ink">
          {row.description}
        </span>
      ),
    },
    {
      header: "CUSTOMER",
      width: 180,
      cell: (row) => <CellText>{row.customer}</CellText>,
      hideBelow: "md",
    },
    {
      header: "AMOUNT",
      width: 110,
      cell: (row) => (
        <span
          className={`text-sm-plus font-semibold ${toneText[row.amountTone]}`}
        >
          {row.amount}
        </span>
      ),
    },
    {
      header: "METHOD",
      width: 120,
      cell: (row) => <CellText>{row.method}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 120,
      cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
    },
    {
      header: "",
      width: 48,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <PaymentDialog
            orderId={row.id}
            reference={row.reference}
            variant="icon"
          />
        </div>
      ),
    },
  ];
}

export default async function RevenuePage({
  searchParams,
}: PageProps<"/revenue">) {
  await requirePageAccess("finance:read");

  const params = await searchParams;
  const [
    kpis,
    revenueTrend,
    revenueByStream,
    allEntries,
    openOrders,
    customers,
  ] = await Promise.all([
    getRevenueKpis(),
    getRevenueTrend(),
    getRevenueByStream(),
    getRevenueEntries(
      {
        search: param(params, "q"),
        customer: param(params, "customer"),
        status: param(params, "status"),
      },
      100,
    ),
    getOpenOrderOptions(),
    getCustomerOptions(),
  ]);

  const revenueEntries = paginateAll(allEntries, params);
  const columns = buildColumns();

  const trendSeries = [
    {
      name: "Collected",
      color: chartColors.primary,
      values: revenueTrend.collected,
    },
    { name: "Invoiced", color: "#DDD6FE", values: revenueTrend.invoiced },
  ];
  const streamTotal = revenueByStream.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );

  return (
    <>
      <PageHeader
        title="Revenue"
        breadcrumb={["Finance", "Revenue"]}
        subtitle="Where the money comes from, and what is still owed."
      >
        <ExportButton board="revenue" />
        <PaymentDialog
          orders={openOrders}
          customers={customers}
          label="Record Revenue"
          variant="primary"
        />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Revenue"
          icon={Banknote}
          value={kpis.monthLabel}
          delta={signedPercent(kpis.monthChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.monthChangePct >= 0 ? "success" : "warning"}
          note="this month"
        />
        <KpiCard
          label="Sales Revenue"
          icon={ShoppingBag}
          value={kpis.coreLabel}
          delta="Core lines"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note={`${percent(kpis.coreSharePct, 0)} of total`}
        />
        <KpiCard
          label="Other Revenue"
          icon={Sprout}
          value={kpis.otherLabel}
          delta="By-products"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="by-products & settlements"
        />
        <KpiCard
          label="Outstanding"
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
            title="Revenue Trend"
            subtitle="Collected vs invoiced · last 8 months · ₵ thousands"
          >
            <ChartLegend series={trendSeries} />
          </PanelHead>
          <BarChart
            labels={revenueTrend.labels}
            ticks={revenueTrend.ticks}
            max={revenueTrend.max}
            height={150}
            series={trendSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Revenue by Stream" subtitle="Last 30 days" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={revenueByStream}
              size={150}
              caption={money(streamTotal / 100, { compact: true })}
              captionLabel="revenue"
            />
            <DonutLegend slices={revenueByStream} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search transaction or customer…"
        filters={[
          {
            name: "customer",
            label: "Customer",
            options: customers.map((customer) => ({
              value: customer.name,
              label: customer.name,
            })),
          },
          {
            name: "status",
            label: "Payment",
            options: [
              { value: "paid", label: "Paid" },
              { value: "partial", label: "Partial" },
              { value: "unpaid", label: "Unpaid" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Revenue Transactions" />
        <DataTable
          columns={columns}
          rows={revenueEntries.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${revenueEntries.range} transactions`}>
          <Pager
            page={revenueEntries.page}
            hasNext={revenueEntries.hasNext}
            hasPrevious={revenueEntries.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
