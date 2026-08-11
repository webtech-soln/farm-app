import {
  CalendarDays,
  CircleCheckBig,
  Clock,
  Map,
  Navigation,
  Plus,
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
import { PageHeader } from "@/components/layout/page-header";
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
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  deliveries,
  deliveriesPerDay,
  drivers,
  type Delivery,
} from "@/lib/data/deliveries";

const daySeries = [
  {
    name: "Completed",
    color: chartColors.primary,
    values: deliveriesPerDay.completed,
  },
  { name: "Scheduled", color: "#DDD6FE", values: deliveriesPerDay.scheduled },
];

const columns: Column<Delivery>[] = [
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
];

export default function DeliveriesPage() {
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
        <Button icon={Plus}>Schedule Delivery</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Pending Dispatch"
          icon={Clock}
          iconTone="warning"
          value="6"
          delta="Act"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="2 overdue"
        />
        <KpiCard
          label="Today's Deliveries"
          icon={CalendarDays}
          value="9"
          delta="5 left"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="4 completed"
        />
        <KpiCard
          label="In Transit"
          icon={Truck}
          value="3"
          delta="Live"
          deltaIcon={Navigation}
          deltaTone="info"
          note="2 drivers on road"
        />
        <KpiCard
          label="Completed (month)"
          icon={CircleCheckBig}
          value="142"
          delta="+12"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="98.6% on time"
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
          <PanelHead title="Driver Workload" subtitle="Today · 9 deliveries" />
          <ul className="flex flex-col gap-3.5">
            {drivers.map((driver) => (
              <li key={driver.name} className="flex flex-col gap-2">
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
        selects={["Driver", "Status", "Date"]}
      />

      <Card className="flex flex-col">
        <PanelHead inset title="Delivery Schedule" />
        <DataTable
          columns={columns}
          rows={deliveries}
          rowKey={(row) => row.reference + row.date}
        />
        <TableFooter summary="Showing 6 of 34 deliveries">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
