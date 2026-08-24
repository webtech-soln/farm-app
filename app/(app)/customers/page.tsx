import {
  CreditCard,
  ReceiptCent,
  TrendingUp,
  TriangleAlert,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { CustomerDialog } from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { paginateAll, param } from "@/lib/pagination";
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
import { Pager } from "@/components/ui/pager";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  getCustomerKpis,
  getCustomerMix,
  getCustomers,
  getRevenueByType,
  type CustomerRow,
  getCustomerFormValues,
  type CustomerFormValues,
} from "@/lib/data/customers";
import { count, money, percent, signedPercent } from "@/lib/format";

function buildColumns(
  formValues: Map<number, CustomerFormValues>,
): Column<CustomerRow>[] {
  return [
    {
      header: "CUSTOMER",
      cell: (row) => <CellStack primary={row.name} secondary={row.descriptor} />,
    },
    {
      header: "TYPE",
      width: 120,
      cell: (row) => <CellText>{row.type}</CellText>,
      hideBelow: "md",
    },
    {
      header: "ORDERS",
      width: 80,
      cell: (row) => <CellText strong>{row.orders}</CellText>,
    },
    {
      header: "TOTAL PURCHASES",
      width: 130,
      cell: (row) => <CellText strong>{row.purchases}</CellText>,
    },
    {
      header: "OUTSTANDING",
      width: 120,
      cell: (row) => (
        <span
          className={`text-sm-plus font-semibold ${
            row.outstandingTone ? toneText[row.outstandingTone] : "text-ink-2"
          }`}
        >
          {row.outstanding}
        </span>
      ),
    },
    {
      header: "LAST PURCHASE",
      width: 130,
      cell: (row) => <CellText>{row.lastPurchase}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 110,
      cell: (row) => (
        <Badge tone={row.statusTone} dot={row.statusDot ?? true}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "",
      width: 48,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <CustomerDialog customer={formValues.get(row.id)} />
        </div>
      ),
    },
  ];
}

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  const params = await searchParams;
  const filters = {
    search: param(params, "q"),
    type: param(params, "type"),
    status: param(params, "status"),
  };

  const [kpis, customerMix, revenueByType, allCustomers, formValues] =
    await Promise.all([
    getCustomerKpis(),
    getCustomerMix(),
    getRevenueByType(),
    getCustomers(filters),
    getCustomerFormValues(),
  ]);

  const columns = buildColumns(formValues);
  const customers = paginateAll(allCustomers, params);

  const mixSeries = [
    {
      name: "Returning",
      color: chartColors.primary,
      values: customerMix.returning,
    },
    { name: "New", color: chartColors.soft, values: customerMix.fresh },
  ];
  const typeRevenue = revenueByType.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <>
      <PageHeader
        title="Customers"
        breadcrumb={["Sales", "Customers"]}
        subtitle="Buyers, balances and purchase history."
      >
        <Button variant="secondary" icon={Upload}>
          Import
        </Button>
        <ExportButton board="customers" />
        <CustomerDialog />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Customers"
          icon={Users}
          value={count(kpis.total)}
          delta={kpis.newThisMonth ? `+${kpis.newThisMonth}` : "—"}
          deltaIcon={TrendingUp}
          deltaTone={kpis.newThisMonth ? "success" : "neutral"}
          note={`${kpis.newThisMonth} new this month`}
        />
        <KpiCard
          label="Active This Month"
          icon={UserCheck}
          value={count(kpis.activeThisMonth)}
          delta={
            kpis.activeChange >= 0
              ? `+${kpis.activeChange}`
              : String(kpis.activeChange)
          }
          deltaIcon={TrendingUp}
          deltaTone={kpis.activeChange >= 0 ? "success" : "warning"}
          note={`${percent(kpis.activeSharePct, 0)} of base`}
        />
        <KpiCard
          label="Outstanding"
          icon={CreditCard}
          iconTone={kpis.accountsOwing ? "warning" : undefined}
          value={kpis.outstandingLabel}
          delta={kpis.accountsOwing ? "Chase" : "Settled"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.accountsOwing ? "warning" : "success"}
          note={`${kpis.accountsOwing} account${
            kpis.accountsOwing === 1 ? "" : "s"
          } owing`}
        />
        <KpiCard
          label="Avg Order Value"
          icon={ReceiptCent}
          value={kpis.averageOrderLabel}
          delta={signedPercent(kpis.averageOrderChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.averageOrderChangePct >= 0 ? "success" : "warning"}
          note="vs last month"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="New vs Returning Customers"
            subtitle="Orders per month · last 8 months"
          >
            <ChartLegend series={mixSeries} />
          </PanelHead>
          <BarChart
            labels={customerMix.labels}
            ticks={customerMix.ticks}
            max={customerMix.max}
            height={150}
            series={mixSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Revenue by Customer Type" subtitle="All time" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={revenueByType}
              size={150}
              caption={money(typeRevenue / 100, { compact: true })}
              captionLabel="revenue"
            />
            <DonutLegend slices={revenueByType} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search customer name or phone…"
        filters={[
          {
            name: "type",
            label: "Type",
            options: [
              { value: "wholesaler", label: "Wholesaler" },
              { value: "retailer", label: "Retailer" },
              { value: "restaurant", label: "Restaurant / hotel" },
              { value: "walk_in", label: "Walk-in" },
            ],
          },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "active", label: "Active" },
              { value: "dormant", label: "Dormant" },
              { value: "overdue", label: "Payment overdue" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="All Customers" />
        <DataTable
          columns={columns}
          rows={customers.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter
          summary={`Showing ${customers.range} of ${kpis.total} customers`}
        >
          <Pager
            page={customers.page}
            hasNext={customers.hasNext}
            hasPrevious={customers.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
