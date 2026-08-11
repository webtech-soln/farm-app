import {
  CircleCheckBig,
  Clock,
  CreditCard,
  Download,
  Plus,
  ShoppingCart,
  TrendingUp,
  Truck,
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
  paymentStatus,
  spendBySupplier,
  suppliers,
  type Supplier,
} from "@/lib/data/suppliers";

const columns: Column<Supplier>[] = [
  {
    header: "SUPPLIER",
    cell: (row) => <CellStack primary={row.name} secondary={row.location} />,
  },
  {
    header: "CATEGORY",
    width: 100,
    cell: (row) => <CellText>{row.category}</CellText>,
    hideBelow: "md",
  },
  {
    header: "CONTACT",
    width: 150,
    cell: (row) => <CellText>{row.contact}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "PRODUCTS",
    width: 84,
    align: "right",
    cell: (row) => <CellText strong>{row.products}</CellText>,
    hideBelow: "md",
  },
  {
    header: "TOTAL PURCHASES",
    width: 130,
    align: "right",
    cell: (row) => <CellText strong>{row.purchases}</CellText>,
  },
  {
    header: "OUTSTANDING",
    width: 108,
    align: "right",
    cell: (row) => (
      <span
        className={`text-sm-plus ${
          row.outstandingTone
            ? `font-semibold ${toneText[row.outstandingTone]}`
            : "text-ink-2"
        }`}
      >
        {row.outstanding}
      </span>
    ),
  },
  {
    header: "STATUS",
    width: 120,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export default function SuppliersPage() {
  return (
    <>
      <PageHeader
        title="Suppliers"
        breadcrumb={["Inventory", "Suppliers"]}
        subtitle="Purchase relationships, spend and outstanding balances."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Supplier</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Suppliers"
          icon={Truck}
          value="12"
          delta="+2"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="2 added this quarter"
        />
        <KpiCard
          label="Purchases (month)"
          icon={ShoppingCart}
          value="$18,940"
          delta="+6.2%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last month"
        />
        <KpiCard
          label="Outstanding"
          icon={CreditCard}
          value="$4,320"
          delta="Due"
          deltaIcon={Clock}
          deltaTone="warning"
          note="3 invoices due"
        />
        <KpiCard
          label="On-time Delivery"
          icon={CircleCheckBig}
          value="94%"
          delta="+2pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="last 90 days"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Spend by Supplier"
            subtitle="Last 6 months · $ thousands"
          />
          <BarChart
            labels={spendBySupplier.labels}
            ticks={spendBySupplier.ticks}
            max={spendBySupplier.max}
            height={160}
            barWidth={30}
            series={[
              {
                name: "Spend",
                color: chartColors.primary,
                values: spendBySupplier.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead title="Payment Status" subtitle="12 suppliers" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={paymentStatus}
              size={150}
              caption="$4.3k"
              captionLabel="outstanding"
            />
            <DonutLegend slices={paymentStatus} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search supplier or product…"
        selects={["Category", "Status", "Balance"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="All Suppliers" />
        <DataTable
          columns={columns}
          rows={suppliers}
          rowKey={(row) => row.name}
        />
        <TableFooter summary="Showing 6 of 12 suppliers">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
