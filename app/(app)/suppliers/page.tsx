import {
  CircleCheckBig,
  Clock,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Truck,
} from "lucide-react";

import { BarChart, chartColors } from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
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
  getSpendBySupplier,
  getSupplierKpis,
  getSupplierPaymentStatus,
  getSuppliers,
  type SupplierRow,
  getSupplierCategories,
  getSupplierFormValues,
  type SupplierFormValues,
} from "@/lib/data/suppliers";
import {
  DeleteSupplierDialog,
  SupplierDialog,
} from "@/components/dialogs/inventory-dialogs";
import { count, money, signedPercent } from "@/lib/format";

function buildColumns(
  formValues: Map<number, SupplierFormValues>,
): Column<SupplierRow>[] {
  return [
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
    {
      header: "",
      width: 72,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <SupplierDialog supplier={formValues.get(row.id)} />
          <DeleteSupplierDialog id={row.id} name={row.name} />
        </div>
      ),
    },
  ];
}

export default async function SuppliersPage({
  searchParams,
}: PageProps<"/suppliers">) {
  const params = await searchParams;
  const filters = {
    search: param(params, "q"),
    category: param(params, "category"),
    status: param(params, "status"),
  };

  const [kpis, spendBySupplier, paymentStatus, allSuppliers, formValues, categories] =
    await Promise.all([
      getSupplierKpis(),
      getSpendBySupplier(),
      getSupplierPaymentStatus(),
      getSuppliers(filters),
      getSupplierFormValues(),
      getSupplierCategories(),
    ]);

  const suppliers = paginateAll(allSuppliers, params);

  const columns = buildColumns(formValues);

  return (
    <>
      <PageHeader
        title="Suppliers"
        breadcrumb={["Inventory", "Suppliers"]}
        subtitle="Purchase relationships, spend and outstanding balances."
      >
        <ExportButton board="suppliers" />
        <SupplierDialog />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Suppliers"
          icon={Truck}
          value={count(kpis.active)}
          delta={`of ${kpis.total}`}
          deltaIcon={Truck}
          deltaTone="neutral"
          note="currently trading"
        />
        <KpiCard
          label="Purchases (month)"
          icon={ShoppingCart}
          value={kpis.purchasesLabel}
          delta={signedPercent(kpis.purchasesChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.purchasesChangePct > 0 ? "error" : "success"}
          note="vs last month"
        />
        <KpiCard
          label="Outstanding"
          icon={CreditCard}
          value={kpis.outstandingLabel}
          delta={kpis.invoicesDue ? "Due" : "Settled"}
          deltaIcon={Clock}
          deltaTone={kpis.overdueSuppliers ? "error" : kpis.invoicesDue ? "warning" : "success"}
          note={`${kpis.invoicesDue} supplier${
            kpis.invoicesDue === 1 ? "" : "s"
          } with a balance`}
        />
        <KpiCard
          label="Stock Receipts"
          icon={CircleCheckBig}
          value={count(kpis.receipts)}
          delta="Recorded"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="goods-in movements"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Spend by Supplier"
            subtitle="Last 12 months · $"
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
          <PanelHead
            title="Payment Status"
            subtitle={`${kpis.total} suppliers`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={paymentStatus}
              size={150}
              caption={money(kpis.outstanding / 100, { compact: true })}
              captionLabel="outstanding"
            />
            <DonutLegend slices={paymentStatus} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search supplier or product…"
        filters={[
          {
            name: "category",
            label: "Category",
            options: categories.map((category) => ({
              value: category,
              label: category,
            })),
          },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "overdue", label: "Payment overdue" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="All Suppliers" />
        <DataTable
          columns={columns}
          rows={suppliers.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter
          summary={`Showing ${suppliers.range} of ${kpis.total} suppliers`}
        >
          <Pager
            page={suppliers.page}
            hasNext={suppliers.hasNext}
            hasPrevious={suppliers.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
