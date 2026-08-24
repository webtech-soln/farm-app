import {
  Banknote,
  CalendarRange,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Utensils,
  Wheat,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { Badge } from "@/components/ui/badge";
import {
  InventoryItemDialog,
  StockMovementDialog,
} from "@/components/dialogs/inventory-dialogs";
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
import { RangeSelect } from "@/components/ui/range-select";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import { getSupplierOptions } from "@/lib/data/suppliers";
import { numberParam, paginateAll, param } from "@/lib/pagination";
import {
  getFeedInventory,
  getFeedKpis,
  getFeedOptions,
  getFeedTrend,
  getStockByType,
  type FeedItemRow,
} from "@/lib/data/feed";
import { percent, signedPercent } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

const columns: Column<FeedItemRow>[] = [
  {
    header: "FEED",
    cell: (row) => <CellStack primary={row.name} secondary={row.batch} />,
  },
  {
    header: "TYPE",
    width: 94,
    cell: (row) => <CellText>{row.type}</CellText>,
    hideBelow: "md",
  },
  {
    header: "QUANTITY",
    width: 92,
    align: "right",
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${
          row.quantityTone ? toneText[row.quantityTone] : "text-ink"
        }`}
      >
        {row.quantity}
      </span>
    ),
  },
  {
    header: "UNIT COST",
    width: 82,
    align: "right",
    cell: (row) => <CellText>{row.unitCost}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "TOTAL VALUE",
    width: 96,
    align: "right",
    cell: (row) => <CellText>{row.totalValue}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "MIN STOCK",
    width: 88,
    align: "right",
    cell: (row) => <CellText>{row.minStock}</CellText>,
    hideBelow: "xl",
  },
  {
    header: "STATUS",
    width: 132,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
  {
    header: "",
    width: 76,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        <StockMovementDialog
          type="stock_in"
          items={[]}
          itemId={row.id}
          label={`Receive ${row.name}`}
          variant="icon"
        />
        <StockMovementDialog
          type="stock_out"
          items={[]}
          itemId={row.id}
          label={`Issue ${row.name}`}
          variant="icon"
        />
      </div>
    ),
  },
];

export default async function FeedPage({
  searchParams,
}: PageProps<"/feed">) {
  await requirePageAccess("records:read");

  const params = await searchParams;
  const days = numberParam(params, "days", 14, { min: 1, max: 365 });
  const filters = {
    search: param(params, "q"),
    supplier: param(params, "supplier"),
  };

  const [kpis, feedTrend, stockByType, allFeed, feedItems, suppliers] =
    await Promise.all([
    getFeedKpis(),
    getFeedTrend(days),
    getStockByType(),
    getFeedInventory(filters),
    getFeedOptions(),
    getSupplierOptions(),
  ]);

  const feedInventory = paginateAll(allFeed, params);

  return (
    <>
      <PageHeader
        title="Feed Management"
        breadcrumb={["Operations", "Feed"]}
        subtitle="Stock levels, consumption and cost across all houses."
      >
        <StockMovementDialog
          type="stock_in"
          items={feedItems}
          label="Stock In"
        />
        <ExportButton board="feed" />
        <StockMovementDialog
          type="stock_out"
          items={feedItems}
          label="Record Feed"
          variant="primary"
        />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Feed Stock"
          icon={Wheat}
          iconTone={kpis.lowStock || kpis.belowMinimum ? "warning" : undefined}
          value={kpis.stockLabel}
          delta={kpis.lowStock ? "Low" : "Healthy"}
          deltaIcon={kpis.lowStock ? TriangleAlert : TrendingUp}
          deltaTone={kpis.lowStock ? "warning" : "success"}
          note={`${kpis.belowMinimum} item${
            kpis.belowMinimum === 1 ? "" : "s"
          } below minimum`}
        />
        <KpiCard
          label="Consumed Today"
          icon={Utensils}
          value={kpis.todayLabel}
          delta={`${kpis.todayChangeKg >= 0 ? "+" : ""}${kpis.todayChangeKg} kg`}
          deltaIcon={kpis.todayChangeKg >= 0 ? TrendingUp : TrendingDown}
          deltaTone="neutral"
          note={`across ${kpis.housesFed} house${
            kpis.housesFed === 1 ? "" : "s"
          }`}
        />
        <KpiCard
          label="Consumed This Week"
          icon={CalendarRange}
          value={kpis.weekLabel}
          delta={signedPercent(kpis.weekChangePct)}
          deltaIcon={kpis.weekChangePct >= 0 ? TrendingUp : TrendingDown}
          deltaTone={kpis.weekChangePct >= 0 ? "error" : "success"}
          note="vs last week"
        />
        <KpiCard
          label="Feed Cost (month)"
          icon={Banknote}
          value={kpis.feedCostLabel}
          delta={percent(kpis.feedCostShare, 0)}
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="of total expenses"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Feed Consumption Trend"
            subtitle="Daily consumption in tonnes · last 14 days"
          >
            <RangeSelect
              name="days"
              defaultValue="14"
              options={[
                { value: "7", label: "Last 7 days" },
                { value: "14", label: "Last 14 days" },
                { value: "30", label: "Last 30 days" },
              ]}
            />
          </PanelHead>
          <ChartLegend
            series={[
              { name: "Broiler feed", color: chartColors.primary },
              { name: "Layer feed", color: chartColors.soft },
            ]}
          />
          <BarChart
            labels={feedTrend.labels}
            ticks={feedTrend.ticks}
            max={feedTrend.max}
            height={160}
            barWidth={9}
            series={[
              {
                name: "Broiler feed",
                color: chartColors.primary,
                values: feedTrend.broiler,
              },
              {
                name: "Layer feed",
                color: chartColors.soft,
                values: feedTrend.layer,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Stock by Feed Type"
            subtitle={`${kpis.stockLabel} on hand`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={stockByType}
              size={150}
              caption={`${kpis.stockTonnes.toFixed(1)}t`}
              captionLabel="on hand"
            />
            <DonutLegend slices={stockByType} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search feed item or supplier…"
        filters={[
          {
            name: "supplier",
            label: "Supplier",
            options: suppliers.map((supplier) => ({
              value: supplier.name,
              label: supplier.name,
            })),
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead
          inset
          title="Feed Inventory"
          subtitle={`Stock valued at ${kpis.stockValueLabel}`}
        >
          <InventoryItemDialog
            suppliers={suppliers}
            category="feed"
            label="Add feed item"
          />
        </PanelHead>
        <DataTable
          columns={columns}
          rows={feedInventory.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter
          summary={`Showing ${feedInventory.range} of ${kpis.items} feed items`}
        >
          <Pager
            page={feedInventory.page}
            hasNext={feedInventory.hasNext}
            hasPrevious={feedInventory.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
