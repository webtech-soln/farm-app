import {
  ArrowDownToLine,
  Banknote,
  CalendarRange,
  ChevronDown,
  Download,
  Plus,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  Utensils,
  Wheat,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
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
import { feedInventory, feedTrend, stockByType, type FeedItem } from "@/lib/data/feed";

const columns: Column<FeedItem>[] = [
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
];

export default function FeedPage() {
  return (
    <>
      <PageHeader
        title="Feed Management"
        breadcrumb={["Operations", "Feed"]}
        subtitle="Stock levels, consumption and cost across all houses."
      >
        <Button variant="secondary" icon={ArrowDownToLine}>
          Stock In
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Record Feed</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Feed Stock"
          icon={Wheat}
          iconTone="warning"
          value="4.8 tons"
          delta="Low"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="2 items below minimum"
        />
        <KpiCard
          label="Consumed Today"
          icon={Utensils}
          value="2.9 tons"
          delta="+40 kg"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="across 6 houses"
        />
        <KpiCard
          label="Consumed This Week"
          icon={CalendarRange}
          value="19.4 tons"
          delta="+3.8%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last week"
        />
        <KpiCard
          label="Feed Cost (month)"
          icon={Banknote}
          value="$6,240"
          delta="+4.1%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="38% of total expenses"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Feed Consumption Trend"
            subtitle="Daily consumption in kg · last 14 days"
          >
            <GhostButton icon={ChevronDown}>Last 14 days</GhostButton>
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
            subtitle="4.8 tons on hand"
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={stockByType}
              size={150}
              caption="4.8t"
              captionLabel="on hand"
            />
            <DonutLegend slices={stockByType} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search feed item or supplier…"
        selects={["Type", "Supplier", "Status"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Feed Inventory" subtitle="Stock valued at $14,280">
          <GhostButton icon={ShoppingCart}>Reorder selected</GhostButton>
        </PanelHead>
        <DataTable
          columns={columns}
          rows={feedInventory}
          rowKey={(row) => row.name}
        />
        <TableFooter summary="Showing 6 of 9 feed items">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
