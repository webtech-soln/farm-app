import {
  Activity,
  BellRing,
  Clock,
  Minus,
  Package,
  Pill,
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
import { Pager } from "@/components/ui/pager";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  getCasesByCondition,
  getHealthAlerts,
  getHealthEvents,
  getHealthEventsTrend,
  getHealthKpis,
  type HealthAlert,
  type HealthEventRow,
} from "@/lib/data/health";
import {
  DeleteHealthEventDialog,
  HealthEventDialog,
  ResolveHealthEventDialog,
} from "@/components/dialogs/health-dialogs";
import { getFlockOptions } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { count } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

const alertIcons: Record<HealthAlert["icon"], LucideIcon> = {
  alert: TriangleAlert,
  vet: Stethoscope,
  vaccine: Syringe,
};

const columns: Column<HealthEventRow>[] = [
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
  {
    header: "",
    width: 72,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        {row.statusKey === "resolved" ? null : (
          <ResolveHealthEventDialog id={row.id} condition={row.condition} />
        )}
        <DeleteHealthEventDialog id={row.id} />
      </div>
    ),
  },
];

export default async function HealthPage({
  searchParams,
}: PageProps<"/health">) {
  await requirePageAccess("health:read");

  const params = await searchParams;
  const window = pageWindow(params);
  const filters = {
    search: param(params, "q"),
    flock: param(params, "flock"),
    house: param(params, "house"),
    status: param(params, "status"),
  };

  const [
    kpis,
    healthEventsTrend,
    casesByCondition,
    healthAlerts,
    events,
    flocks,
    houses,
  ] = await Promise.all([
    getHealthKpis(),
    getHealthEventsTrend(),
    getCasesByCondition(),
    getHealthAlerts(),
    getHealthEvents(filters, window.limit, window.offset),
    getFlockOptions({ activeOnly: true }),
    getHouseOptions(),
  ]);

  const healthEvents = paginate(events, window);

  const eventSeries = [
    {
      name: "Resolved",
      color: chartColors.primary,
      values: healthEventsTrend.resolved,
    },
    { name: "Open", color: "#F59E0B", values: healthEventsTrend.open },
  ];
  const caseTotal = casesByCondition.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );

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
        <HealthEventDialog flocks={flocks} houses={houses} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        <KpiCard
          label="Active Cases"
          icon={Activity}
          iconTone={kpis.activeCases ? "warning" : undefined}
          value={count(kpis.activeCases)}
          delta={kpis.activeCases ? "Watch" : "Clear"}
          deltaIcon={kpis.activeCases ? TriangleAlert : Minus}
          deltaTone={kpis.activeCases ? "warning" : "success"}
          note={`${kpis.affectedFlocks} flock${
            kpis.affectedFlocks === 1 ? "" : "s"
          } affected`}
        />
        <KpiCard
          label="Vaccinations Due"
          icon={Syringe}
          iconTone={kpis.vaccinationsOverdue ? "error" : "info"}
          value={count(kpis.vaccinationsDue)}
          delta={kpis.vaccinationsOverdue ? "Overdue" : "Soon"}
          deltaIcon={kpis.vaccinationsOverdue ? TriangleAlert : Clock}
          deltaTone={kpis.vaccinationsOverdue ? "error" : "info"}
          note={
            kpis.vaccinationsOverdue
              ? `${kpis.vaccinationsOverdue} past due`
              : "within 7 days"
          }
        />
        <KpiCard
          label="Ongoing Treatments"
          icon={Pill}
          value={count(kpis.inTreatment)}
          delta="—"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="flocks under treatment"
        />
        <KpiCard
          label="Medicines in Stock"
          icon={Package}
          iconTone={kpis.medicinesExpiring ? "warning" : undefined}
          value={count(kpis.medicineItems)}
          delta={kpis.medicinesExpiring ? "Check" : "OK"}
          deltaIcon={kpis.medicinesExpiring ? TriangleAlert : Minus}
          deltaTone={kpis.medicinesExpiring ? "warning" : "success"}
          note={`${kpis.medicinesExpiring} expiring soon`}
        />
        <KpiCard
          label="Health Alerts"
          icon={BellRing}
          iconTone={kpis.escalated ? "error" : undefined}
          value={count(kpis.escalated)}
          delta={kpis.escalated ? "Urgent" : "Clear"}
          deltaIcon={kpis.escalated ? TriangleAlert : Minus}
          deltaTone={kpis.escalated ? "error" : "success"}
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
              caption={count(caseTotal)}
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
          rows={healthEvents.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${healthEvents.range} events`}>
          <Pager
            page={healthEvents.page}
            hasNext={healthEvents.hasNext}
            hasPrevious={healthEvents.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
