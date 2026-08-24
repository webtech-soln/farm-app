import {
  Banknote,
  CalendarX,
  Pill,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { BarChart, chartColors } from "@/components/charts/bar-chart";
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
  getMedicineKpis,
  getMedicineUsage,
  getMedicines,
  getStockByCategory,
  type MedicineRow,
} from "@/lib/data/medicines";
import {
  ArchiveItemDialog,
  InventoryItemDialog,
  StockMovementDialog,
} from "@/components/dialogs/inventory-dialogs";
import {
  getInventoryFormValues,
  type InventoryFormValues,
} from "@/lib/data/inventory";
import { getSupplierOptions } from "@/lib/data/suppliers";
import { paginateAll, param } from "@/lib/pagination";
import { count } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

function buildColumns(
  suppliers: { id: number; name: string }[],
  formValues: Map<number, InventoryFormValues>,
  items: { id: number; name: string; unit?: string }[],
): Column<MedicineRow>[] {
  return [
    {
      header: "MEDICINE",
      cell: (row) => <CellStack primary={row.name} secondary={row.supplier} />,
    },
    {
      header: "CATEGORY",
      width: 130,
      cell: (row) => <CellText>{row.category}</CellText>,
      hideBelow: "md",
    },
    {
      header: "QUANTITY",
      width: 90,
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
      width: 80,
      cell: (row) => <CellText>{row.unit}</CellText>,
    },
    {
      header: "BATCH",
      width: 120,
      cell: (row) => <CellText>{row.batch}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "EXPIRATION",
      width: 130,
      cell: (row) => (
        <CellStack primary={row.expiry} secondary={row.expiryNote} />
      ),
    },
    {
      header: "UNIT COST",
      width: 100,
      cell: (row) => <CellText>{row.unitCost}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 140,
      cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
    },
    {
      header: "",
      width: 100,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <StockMovementDialog
            type="stock_out"
            items={items}
            itemId={row.id}
            label={`Issue ${row.name}`}
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

export default async function MedicinesPage({
  searchParams,
}: PageProps<"/medicines">) {
  await requirePageAccess("health:read");

  const params = await searchParams;
  const filters = {
    search: param(params, "q"),
    subcategory: param(params, "subcategory"),
    supplier: param(params, "supplier"),
  };

  const [
    kpis,
    medicineUsage,
    stockByCategory,
    allMedicines,
    formValues,
    suppliers,
  ] = await Promise.all([
    getMedicineKpis(),
    getMedicineUsage(),
    getStockByCategory(),
    getMedicines(filters),
    getInventoryFormValues(),
    getSupplierOptions(),
  ]);

  const medicines = paginateAll(allMedicines, params);

  const itemOptions = allMedicines.map((row) => ({
    id: row.id,
    name: row.name,
    unit: row.unit,
  }));

  const columns = buildColumns(suppliers, formValues, itemOptions);

  return (
    <>
      <PageHeader
        title="Medicine Inventory"
        breadcrumb={["Health", "Medicines"]}
        subtitle="Batches, expiry and consumption of veterinary stock."
      >
        <StockMovementDialog type="stock_in" items={itemOptions} />
        <InventoryItemDialog
          suppliers={suppliers}
          category="medicine"
          label="Add Medicine"
        />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Medicines in Stock"
          icon={Pill}
          value={count(kpis.items)}
          delta={`${stockByCategory.length} categories`}
          deltaIcon={Pill}
          deltaTone="neutral"
          note="active batches"
        />
        <KpiCard
          label="Stock Value"
          icon={Banknote}
          value={kpis.totalValueLabel}
          delta="At cost"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="quantity × unit cost"
        />
        <KpiCard
          label={`Expiring ≤${kpis.warningDays} days`}
          icon={CalendarX}
          iconTone={kpis.expiring ? "warning" : undefined}
          value={`${kpis.expiring} item${kpis.expiring === 1 ? "" : "s"}`}
          delta={kpis.expiring ? "Use first" : "Clear"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.expiring ? "warning" : "success"}
          note={
            kpis.expired ? `${kpis.expired} already expired` : "none expired"
          }
        />
        <KpiCard
          label="Below Minimum"
          icon={TriangleAlert}
          iconTone={kpis.belowMinimum ? "error" : undefined}
          value={`${kpis.belowMinimum} item${kpis.belowMinimum === 1 ? "" : "s"}`}
          delta={kpis.belowMinimum ? "Reorder" : "Stocked"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.belowMinimum ? "error" : "success"}
          note={kpis.belowMinimum ? "reorder now" : "all above minimum"}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead title="Medicine Usage" subtitle="Units issued per month" />
          <BarChart
            labels={medicineUsage.labels}
            ticks={medicineUsage.ticks}
            max={medicineUsage.max}
            height={150}
            barWidth={60}
            series={[
              {
                name: "Usage",
                color: chartColors.primary,
                values: medicineUsage.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead
            title="Stock by Category"
            subtitle={`${count(kpis.items)} items`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={stockByCategory}
              size={150}
              caption={count(kpis.items)}
              captionLabel="items"
            />
            <DonutLegend slices={stockByCategory} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search medicine or batch…"
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
        <PanelHead inset title="Medicine Register" />
        <DataTable columns={columns} rows={medicines.rows} rowKey={(row) => String(row.id)} />
        <TableFooter
          summary={`Showing ${medicines.range} of ${kpis.items} medicines`}
        >
          <Pager
            page={medicines.page}
            hasNext={medicines.hasNext}
            hasPrevious={medicines.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
