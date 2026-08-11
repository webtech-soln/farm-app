import {
  ArrowDownToLine,
  Banknote,
  CalendarX,
  Pill,
  Plus,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { BarChart, chartColors } from "@/components/charts/bar-chart";
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
  medicineUsage,
  medicines,
  stockByCategory,
  type Medicine,
} from "@/lib/data/medicines";

const columns: Column<Medicine>[] = [
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
];

export default function MedicinesPage() {
  return (
    <>
      <PageHeader
        title="Medicine Inventory"
        breadcrumb={["Health", "Medicines"]}
        subtitle="Batches, expiry and consumption of veterinary stock."
      >
        <Button variant="secondary" icon={ArrowDownToLine}>
          Stock In
        </Button>
        <Button icon={Plus}>Add Medicine</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Medicines in Stock"
          icon={Pill}
          value="24"
          delta="+2"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="6 categories"
        />
        <KpiCard
          label="Stock Value"
          icon={Banknote}
          value="$6,916"
          delta="+3.4%"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="18% of inventory"
        />
        <KpiCard
          label="Expiring ≤30 days"
          icon={CalendarX}
          iconTone="warning"
          value="2 items"
          delta="Use first"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="$412 at risk"
        />
        <KpiCard
          label="Below Minimum"
          icon={TriangleAlert}
          iconTone="error"
          value="3 items"
          delta="Reorder"
          deltaIcon={TriangleAlert}
          deltaTone="error"
          note="reorder now"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead title="Medicine Usage" subtitle="Cost per month · $" />
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
          <PanelHead title="Stock by Category" subtitle="24 items" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={stockByCategory}
              size={150}
              caption="24"
              captionLabel="items"
            />
            <DonutLegend slices={stockByCategory} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search medicine or batch…"
        selects={["Category", "Supplier", "Expiry", "Status"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Medicine Register" />
        <DataTable
          columns={columns}
          rows={medicines}
          rowKey={(row) => row.batch}
        />
        <TableFooter summary="Showing 6 of 24 medicines">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
