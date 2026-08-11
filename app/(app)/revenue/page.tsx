import {
  Banknote,
  CreditCard,
  Download,
  Plus,
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
  revenueByStream,
  revenueEntries,
  revenueTrend,
  type RevenueEntry,
} from "@/lib/data/revenue";

const trendSeries = [
  {
    name: "Collected",
    color: chartColors.primary,
    values: revenueTrend.collected,
  },
  { name: "Invoiced", color: "#DDD6FE", values: revenueTrend.invoiced },
];

const columns: Column<RevenueEntry>[] = [
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
];

export default function RevenuePage() {
  return (
    <>
      <PageHeader
        title="Revenue"
        breadcrumb={["Finance", "Revenue"]}
        subtitle="Where the money comes from, and what is still owed."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Record Revenue</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Revenue"
          icon={Banknote}
          value="$24,820"
          delta="+12.4%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="this month"
        />
        <KpiCard
          label="Sales Revenue"
          icon={ShoppingBag}
          value="$23,610"
          delta="+11.8%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="95% of total"
        />
        <KpiCard
          label="Other Revenue"
          icon={Sprout}
          value="$1,210"
          delta="+24%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="manure & spent layers"
        />
        <KpiCard
          label="Outstanding"
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
            title="Revenue Trend"
            subtitle="Collected vs invoiced · last 8 months · $ thousands"
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
          <PanelHead title="Revenue by Stream" subtitle="August 2026" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={revenueByStream}
              size={150}
              caption="$24.8k"
              captionLabel="revenue"
            />
            <DonutLegend slices={revenueByStream} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search transaction or customer…"
        selects={["Stream", "Customer", "Status", "Date range"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Revenue Transactions" />
        <DataTable
          columns={columns}
          rows={revenueEntries}
          rowKey={(row) => row.reference + row.date}
        />
        <TableFooter summary="Showing 6 of 162 transactions">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
