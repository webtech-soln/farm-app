import {
  Activity,
  BellRing,
  Clock,
  Minus,
  Package,
  Pill,
  Plus,
  Stethoscope,
  Syringe,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
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
import { GhostButton } from "@/components/ui/ghost-button";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  casesByCondition,
  healthAlerts,
  healthEvents,
  healthEventsTrend,
  type HealthAlert,
  type HealthEvent,
} from "@/lib/data/health";

const alertIcons: Record<HealthAlert["icon"], LucideIcon> = {
  alert: TriangleAlert,
  vet: Stethoscope,
  vaccine: Syringe,
};

const eventSeries = [
  {
    name: "Resolved",
    color: chartColors.primary,
    values: healthEventsTrend.resolved,
  },
  { name: "Open", color: "#F59E0B", values: healthEventsTrend.open },
];

const columns: Column<HealthEvent>[] = [
  {
    header: "DATE",
    cell: (row) => <CellStack primary={row.date} secondary={row.reportedBy} />,
  },
  {
    header: "FLOCK",
    width: 130,
    cell: (row) => <CellText strong>{row.flock}</CellText>,
  },
  {
    header: "HOUSE",
    width: 90,
    cell: (row) => <CellText>{row.house}</CellText>,
    hideBelow: "md",
  },
  {
    header: "CONDITION",
    width: 180,
    cell: (row) => <CellText>{row.condition}</CellText>,
  },
  {
    header: "CASES",
    width: 70,
    cell: (row) => <CellText strong>{row.cases}</CellText>,
  },
  {
    header: "TREATMENT",
    width: 180,
    cell: (row) => <CellText>{row.treatment}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "STATUS",
    width: 130,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Health Dashboard"
        breadcrumb={["Health"]}
        subtitle="Disease events, treatments and veterinary follow-up."
      >
        <Button variant="secondary" icon={Stethoscope}>
          Vet log
        </Button>
        <Button icon={Plus}>Log Health Event</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          label="Active Cases"
          icon={Activity}
          iconTone="warning"
          value="3"
          delta="Watch"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="2 flocks affected"
        />
        <KpiCard
          label="Vaccinations Due"
          icon={Syringe}
          iconTone="info"
          value="2"
          delta="Soon"
          deltaIcon={Clock}
          deltaTone="info"
          note="within 7 days"
        />
        <KpiCard
          label="Ongoing Treatments"
          icon={Pill}
          value="2"
          delta="—"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="day 3 of 5"
        />
        <KpiCard
          label="Medicines in Stock"
          icon={Package}
          iconTone="warning"
          value="24"
          delta="Check"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="2 expiring soon"
        />
        <KpiCard
          label="Health Alerts"
          icon={BellRing}
          iconTone="error"
          value="1"
          delta="Urgent"
          deltaIcon={TriangleAlert}
          deltaTone="error"
          note="needs vet review"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Health Events"
            subtitle="Cases opened per week · last 8 weeks"
          >
            <ChartLegend series={eventSeries} />
          </PanelHead>
          <BarChart
            labels={healthEventsTrend.labels}
            ticks={healthEventsTrend.ticks}
            max={healthEventsTrend.max}
            height={150}
            series={eventSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Cases by Condition" subtitle="Last 90 days" />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={casesByCondition}
              size={150}
              caption="35"
              captionLabel="cases"
            />
            <DonutLegend slices={casesByCondition} />
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-4 p-4">
        <PanelHead
          title="Attention Required"
          subtitle="Health issues needing a decision today"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {healthAlerts.map((alert) => (
            <div key={alert.title} className="flex gap-3">
              <IconChip
                icon={alertIcons[alert.icon]}
                tone={alert.tone}
                size={32}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-base font-semibold text-ink">
                  {alert.title}
                </span>
                <span className="text-xs text-ink-3">{alert.location}</span>
                <p className="text-sm leading-[1.45] text-ink-2">
                  {alert.description}
                </p>
                <button
                  type="button"
                  className="mt-1 self-start text-xs-plus font-semibold text-violet-deep hover:underline"
                >
                  {alert.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col">
        <PanelHead inset title="Health Events" />
        <DataTable
          columns={columns}
          rows={healthEvents}
          rowKey={(row) => row.date + row.flock}
        />
        <TableFooter summary="Showing 5 of 35 events">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
