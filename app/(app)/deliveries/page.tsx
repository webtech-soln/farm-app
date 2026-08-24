import {
  CalendarDays,
  CircleCheckBig,
  Clock,
  Map,
  Navigation,
  TrendingUp,
  TriangleAlert,
  Truck,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { ProgressRail } from "@/components/charts/progress-rail";
import {
  DeliveryDialog,
  DeliveryStatusDialog,
} from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { Avatar } from "@/components/ui/avatar";
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
import {
  getDeliveries,
  getDeliveriesPerDay,
  getDeliveryKpis,
  getDrivers,
  type DeliveryRow,
  getDriverOptions,
  getUndispatchedOrders,
} from "@/lib/data/deliveries";
import { count, percent } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

function buildColumns(): Column<DeliveryRow>[] {
  return [
    {
      header: "ORDER",
      cell: (row) => <CellStack primary={row.reference} secondary={row.load} />,
    },
    {
      header: "CUSTOMER",
      width: 180,
      cell: (row) => <CellText>{row.customer}</CellText>,
    },
    {
      header: "DESTINATION",
      width: 180,
      cell: (row) => <CellText>{row.destination}</CellText>,
      hideBelow: "md",
    },
    {
      header: "DRIVER",
      width: 150,
      cell: (row) => <CellText>{row.driver}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "DATE",
      width: 130,
      cell: (row) => <CellStack primary={row.date} secondary={row.window} />,
    },
    {
      header: "STATUS",
      width: 120,
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
          <DeliveryStatusDialog
            id={row.id}
            destination={row.destination}
            status={row.statusKey}
          />
        </div>
      ),
    },
  ];
}

export default async function DeliveriesPage({
  searchParams,
}: PageProps<"/deliveries">) {
  await requirePageAccess("deliveries:read");

  const params = await searchParams;
  const window = pageWindow(params);
  const filters = {
    search: param(params, "q"),
    status: param(params, "status"),
    driver: param(params, "driver"),
    date: param(params, "date"),
  };

  const [kpis, deliveriesPerDay, drivers, rows, openOrders, driverOptions] =
    await Promise.all([
    getDeliveryKpis(),
    getDeliveriesPerDay(),
    getDrivers(),
    getDeliveries(filters, window.limit, window.offset),
    getUndispatchedOrders(),
    getDriverOptions(),
  ]);

  const deliveries = paginate(rows, window);
  const columns = buildColumns();

  const daySeries = [
    {
      name: "Completed",
      color: chartColors.primary,
      values: deliveriesPerDay.completed,
    },
    { name: "Scheduled", color: "#DDD6FE", values: deliveriesPerDay.scheduled },
  ];

  return (
    <>
      <PageHeader
        title="Delivery Management"
        breadcrumb={["Sales", "Deliveries"]}
        subtitle="Dispatch, drivers and proof of delivery."
      >
        <Button variant="secondary" icon={Map}>
          Route plan
        </Button>
        <DeliveryDialog orders={openOrders} drivers={driverOptions} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Pending Dispatch"
          icon={Clock}
          iconTone={kpis.overdueDispatch ? "warning" : undefined}
          value={count(kpis.pendingDispatch)}
          delta={kpis.overdueDispatch ? "Act" : "On track"}
          deltaIcon={TriangleAlert}
          deltaTone={kpis.overdueDispatch ? "warning" : "success"}
          note={`${kpis.overdueDispatch} overdue`}
        />
        <KpiCard
          label="Today's Deliveries"
          icon={CalendarDays}
          value={count(kpis.today)}
          delta={`${kpis.remainingToday} left`}
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note={`${kpis.completedToday} completed`}
        />
        <KpiCard
          label="In Transit"
          icon={Truck}
          value={count(kpis.inTransit)}
          delta={kpis.inTransit ? "Live" : "Idle"}
          deltaIcon={Navigation}
          deltaTone={kpis.inTransit ? "info" : "neutral"}
          note={`${kpis.driversOnRoad} driver${
            kpis.driversOnRoad === 1 ? "" : "s"
          } on road`}
        />
        <KpiCard
          label="Completed (month)"
          icon={CircleCheckBig}
          value={count(kpis.completedThisMonth)}
          delta={
            kpis.monthChange >= 0
              ? `+${kpis.monthChange}`
              : String(kpis.monthChange)
          }
          deltaIcon={TrendingUp}
          deltaTone={kpis.monthChange >= 0 ? "success" : "warning"}
          note={`${percent(kpis.successRate)} delivered`}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Deliveries per Day"
            subtitle="Completed vs scheduled · last 7 days"
          >
            <ChartLegend series={daySeries} />
          </PanelHead>
          <BarChart
            labels={deliveriesPerDay.labels}
            ticks={deliveriesPerDay.ticks}
            max={deliveriesPerDay.max}
            height={150}
            barWidth={18}
            series={daySeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead
            title="Driver Workload"
            subtitle={`Today · ${kpis.today} deliver${
              kpis.today === 1 ? "y" : "ies"
            }`}
          />
          <ul className="flex flex-col gap-3.5">
            {drivers.map((driver) => (
              <li key={driver.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar initials={driver.initials} />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm-plus font-semibold text-ink">
                      {driver.name}
                    </span>
                    <span className="truncate text-xs text-ink-3">
                      {driver.route}
                    </span>
                  </div>
                  <Badge tone={driver.statusTone}>{driver.status}</Badge>
                </div>
                <ProgressRail value={driver.progress} height={6} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <FilterBar
        placeholder="Search order or destination…"
        filters={[
          {
            name: "driver",
            label: "Driver",
            options: driverOptions.map((driver) => ({
              value: driver.name,
              label: driver.name,
            })),
          },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "scheduled", label: "Scheduled" },
              { value: "preparing", label: "Preparing" },
              { value: "in_transit", label: "In transit" },
              { value: "delivered", label: "Delivered" },
              { value: "failed", label: "Failed" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Delivery Schedule" />
        <DataTable
          columns={columns}
          rows={deliveries.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${deliveries.range} deliveries`}>
          <Pager
            page={deliveries.page}
            hasNext={deliveries.hasNext}
            hasPrevious={deliveries.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
