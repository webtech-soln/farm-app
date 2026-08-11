import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  CalendarX,
  ChevronDown,
  Clock,
  Package,
  Plus,
  TrendingUp,
  TriangleAlert,
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
import {
  inventoryItems,
  stockMovement,
  valueByCategory,
  type InventoryItem,
} from "@/lib/data/inventory";

const columns: Column<InventoryItem>[] = [
  {
    header: "ITEM",
    cell: (row) => <CellStack primary={row.name} secondary={row.sku} />,
  },
  {
    header: "CATEGORY",
    width: 100,
    cell: (row) => <CellText>{row.category}</CellText>,
    hideBelow: "md",
  },
  {
    header: "QUANTITY",
    width: 86,
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
    header: "UNIT",
    width: 64,
    cell: (row) => <CellText>{row.unit}</CellText>,
  },
  {
    header: "UNIT COST",
    width: 86,
    align: "right",
    cell: (row) => <CellText>{row.unitCost}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "EXPIRATION",
    width: 104,
    cell: (row) => <CellText>{row.expiration}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "STATUS",
    width: 132,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export default function InventoryPage() {
  return (
    <>
      <PageHeader
        title="Inventory"
        breadcrumb={["Inventory"]}
        subtitle="Feed, medicine, equipment and consumables in one register."
      >
        <Button variant="secondary" icon={ArrowDownToLine}>
          Stock In
        </Button>
        <Button variant="secondary" icon={ArrowUpFromLine}>
          Stock Out
        </Button>
        <Button icon={Plus}>Add Inventory</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Items"
          icon={Package}
          value="148"
          delta="+6"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="across 6 categories"
        />
        <KpiCard
          label="Inventory Value"
          icon={Banknote}
          value="$38,420"
          delta="+2.8%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Low Stock"
          icon={TriangleAlert}
          iconTone="warning"
          value="7 items"
          delta="Action"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="need reordering"
        />
        <KpiCard
          label="Expiring Soon"
          icon={CalendarX}
          iconTone="error"
          value="3 items"
          delta="Urgent"
          deltaIcon={Clock}
          deltaTone="error"
          note="within 30 days"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Stock Movement"
            subtitle="Value in and out · last 8 weeks · $"
          />
          <ChartLegend
            series={[
              { name: "Stock in", color: chartColors.primary },
              { name: "Stock out", color: chartColors.soft },
            ]}
          />
          <BarChart
            labels={stockMovement.labels}
            ticks={stockMovement.ticks}
            max={stockMovement.max}
            height={160}
            series={[
              {
                name: "Stock in",
                color: chartColors.primary,
                values: stockMovement.stockIn,
              },
              {
                name: "Stock out",
                color: chartColors.soft,
                values: stockMovement.stockOut,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead title="Value by Category" subtitle="$38,420 total" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={valueByCategory}
              size={150}
              caption="$38.4k"
              captionLabel="value"
            />
            <DonutLegend slices={valueByCategory} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search item, SKU or supplier…"
        selects={["Category", "Location", "Status", "Expiry"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Inventory Register">
          <GhostButton icon={ChevronDown}>Bulk actions</GhostButton>
        </PanelHead>
        <DataTable
          columns={columns}
          rows={inventoryItems}
          rowKey={(row) => row.sku}
        />
        <TableFooter summary="Showing 7 of 148 items">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
