import {
  Banknote,
  CalendarX,
  Clock,
  Package,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
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
  ArchiveItemDialog,
  InventoryItemDialog,
  StockMovementDialog,
} from "@/components/dialogs/inventory-dialogs";
import {
  getInventoryItems,
  getInventoryKpis,
  getStockMovement,
  getValueByCategory,
  type StockRow,
  getInventoryFormValues,
  type InventoryFormValues,
} from "@/lib/data/inventory";
import { getSupplierOptions } from "@/lib/data/suppliers";
import { paginateAll, param } from "@/lib/pagination";
import { count, money } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

function buildColumns(
  suppliers: { id: number; name: string }[],
  formValues: Map<number, InventoryFormValues>,
): Column<StockRow>[] {
  return [
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
    {
      header: "",
      width: 100,
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
          <InventoryItemDialog
            suppliers={suppliers}
            item={formValues.get(row.id)}
          />
          <ArchiveItemDialog id={row.id} name={row.name} />
        </div>
      ),
    },
  ];
}

export default async function InventoryPage({
  searchParams,
}: PageProps<"/inventory">) {
  await requirePageAccess("inventory:read");

  const params = await searchParams;
  const category = param(params, "category");
  const status = param(params, "status");
  const filters = {
    search: param(params, "q"),
    category: category as never,
    supplier: param(params, "supplier"),
    status: status as never,
  };

  const [
    kpis,
    allItems,
    stockMovement,
    valueByCategory,
    formValues,
    suppliers,
  ] = await Promise.all([
    getInventoryKpis(),
    getInventoryItems(filters),
    getStockMovement(),
    getValueByCategory(),
    getInventoryFormValues(),
    getSupplierOptions(),
  ]);

  const inventoryItems = paginateAll(allItems, params);

  const itemOptions = allItems.map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit,
  }));

  const columns = buildColumns(suppliers, formValues);

  const categories = new Set(allItems.map((item) => item.categoryKey));

  return (
    <>
      <PageHeader
        title="Inventory"
        breadcrumb={["Inventory"]}
        subtitle="Feed, medicine, equipment and consumables in one register."
      >
        <StockMovementDialog type="stock_in" items={itemOptions} />
        <StockMovementDialog type="stock_out" items={itemOptions} />
        <InventoryItemDialog suppliers={suppliers} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Items"
          icon={Package}
          value={count(kpis.items)}
          delta={`${categories.size} categories`}
          deltaIcon={Package}
          deltaTone="neutral"
          note="active stock lines"
        />
        <KpiCard
          label="Inventory Value"
          icon={Banknote}
          value={kpis.totalValueLabel}
          delta="At cost"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="quantity × unit cost"
        />
        <KpiCard
          label="Low Stock"
          icon={TriangleAlert}
          iconTone={kpis.belowMinimum ? "warning" : undefined}
          value={`${kpis.belowMinimum} item${kpis.belowMinimum === 1 ? "" : "s"}`}
          delta={kpis.belowMinimum ? "Action" : "Clear"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.belowMinimum ? "warning" : "success"}
          note="below minimum stock"
        />
        <KpiCard
          label="Expiring Soon"
          icon={CalendarX}
          iconTone={kpis.expiring ? "error" : undefined}
          value={`${kpis.expiring} item${kpis.expiring === 1 ? "" : "s"}`}
          delta={kpis.expiring ? "Urgent" : "Clear"}
          deltaIcon={Clock}
          deltaTone={kpis.expiring ? "error" : "success"}
          note="within the warning window"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Stock Movement"
            subtitle="Value in and out · last 8 weeks · ₵"
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
          <PanelHead
            title="Value by Category"
            subtitle={`${kpis.totalValueLabel} total`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={valueByCategory}
              size={150}
              caption={money(kpis.totalValue / 100, { compact: true })}
              captionLabel="value"
            />
            <DonutLegend slices={valueByCategory} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search item, SKU or supplier…"
        filters={[
          {
            name: "category",
            label: "Category",
            options: [
              { value: "feed", label: "Feed" },
              { value: "medicine", label: "Medicine" },
              { value: "equipment", label: "Equipment" },
              { value: "packaging", label: "Packaging" },
              { value: "consumable", label: "Consumable" },
              { value: "other", label: "Other" },
            ],
          },
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
              { value: "in_stock", label: "In stock" },
              { value: "low", label: "Reorder soon" },
              { value: "below_minimum", label: "Below minimum" },
              { value: "expiring", label: "Expiring" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Inventory Register">
          <StockMovementDialog
            type="adjustment"
            items={itemOptions}
            label="Recount"
          />
        </PanelHead>
        <DataTable
          columns={columns}
          rows={inventoryItems.rows}
          rowKey={(row) => row.sku}
        />
        <TableFooter
          summary={`Showing ${inventoryItems.range} of ${kpis.items} items`}
        >
          <Pager
            page={inventoryItems.page}
            hasNext={inventoryItems.hasNext}
            hasPrevious={inventoryItems.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
