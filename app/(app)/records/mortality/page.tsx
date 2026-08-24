import {
  Calendar,
  CalendarDays,
  CalendarRange,
  HeartPulse,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { Badge } from "@/components/ui/badge";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import {
  DeleteMortalityDialog,
  MortalityFormDialog,
  MortalityStatusDialog,
} from "@/components/dialogs/record-dialogs";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pager } from "@/components/ui/pager";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  getMortalityByCause,
  getMortalityKpis,
  getMortalityRecords,
  getMortalityTrend,
  type MortalityRecordRow,
  getMortalityCauses,
} from "@/lib/data/mortality";
import { getFlockOptions } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { getFarmSettings } from "@/lib/data/settings";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { count, percent, signedPercent } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

const columns: Column<MortalityRecordRow>[] = [
  {
    header: "DATE",
    width: 110,
    cell: (row) => <CellStack primary={row.date} secondary={row.time} />,
  },
  {
    header: "FLOCK",
    width: 110,
    cell: (row) => <CellText strong>{row.flock}</CellText>,
  },
  {
    header: "HOUSE",
    width: 82,
    cell: (row) => <CellText>{row.house}</CellText>,
    hideBelow: "md",
  },
  {
    header: "DEATHS",
    width: 72,
    align: "right",
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${row.deathsAlert ? "text-error" : "text-ink"}`}
      >
        {row.deaths}
      </span>
    ),
  },
  { header: "CAUSE", cell: (row) => <CellText>{row.cause}</CellText> },
  {
    header: "RECORDED BY",
    width: 118,
    cell: (row) => <CellText>{row.recordedBy}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "STATUS",
    width: 136,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
  {
    header: "",
    width: 72,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        <MortalityStatusDialog id={row.id} status={row.statusKey} />
        <DeleteMortalityDialog id={row.id} />
      </div>
    ),
  },
];

export default async function MortalityPage({
  searchParams,
}: PageProps<"/records/mortality">) {
  await requirePageAccess("records:read");

  const params = await searchParams;
  const window = pageWindow(params);
  const filters = {
    search: param(params, "q"),
    house: param(params, "house"),
    flock: param(params, "flock"),
    cause: param(params, "cause"),
    status: param(params, "status"),
  };

  const [
    kpis,
    mortalityTrend,
    mortalityByCause,
    records,
    settings,
    flocks,
    houses,
    causes,
  ] = await Promise.all([
    getMortalityKpis(),
    getMortalityTrend(),
    getMortalityByCause(),
    getMortalityRecords(filters, window.limit, window.offset),
    getFarmSettings(),
    getFlockOptions({ activeOnly: true }),
    getHouseOptions(),
    getMortalityCauses(),
  ]);

  const mortalityRecords = paginate(records, window);

  const causeTotal = mortalityByCause.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );
  const weekPct =
    kpis.week - kpis.weekChange > 0
      ? (kpis.weekChange / (kpis.week - kpis.weekChange)) * 100
      : 0;
  const nearLimit = kpis.weeklyRatePct >= settings.weeklyMortalityAlertPct;

  return (
    <>
      <PageHeader
        title="Mortality Overview"
        breadcrumb={["Operations", "Mortality"]}
        subtitle="Track losses by flock, house and cause across the farm."
      >
        <ExportButton board="mortality" />
        <MortalityFormDialog flocks={flocks} houses={houses} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Today"
          icon={CalendarDays}
          value={`${count(kpis.today)} birds`}
          delta={kpis.openCases ? `${kpis.openCases} open` : "No open cases"}
          deltaIcon={kpis.openCases ? TriangleAlert : TrendingDown}
          deltaTone={kpis.openCases ? "warning" : "success"}
          note="logged so far today"
        />
        <KpiCard
          label="This Week"
          icon={CalendarRange}
          value={`${count(kpis.week)} birds`}
          delta={signedPercent(weekPct)}
          deltaIcon={kpis.weekChange > 0 ? TrendingUp : TrendingDown}
          deltaTone={kpis.weekChange > 0 ? "error" : "success"}
          note="vs last week"
        />
        <KpiCard
          label="This Month"
          icon={Calendar}
          value={`${count(kpis.month)} birds`}
          delta="30 days"
          deltaIcon={Calendar}
          deltaTone="neutral"
          note="rolling window"
        />
        <KpiCard
          label="Mortality Rate"
          icon={HeartPulse}
          iconTone={nearLimit ? "warning" : undefined}
          value={kpis.weeklyRateLabel}
          delta={nearLimit ? "Near limit" : "Within limit"}
          deltaIcon={nearLimit ? TriangleAlert : TrendingDown}
          deltaTone={nearLimit ? "warning" : "success"}
          note={`threshold ${percent(settings.weeklyMortalityAlertPct)}`}
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Mortality Trend"
            subtitle="Daily deaths across all flocks · last 14 days"
          />
          <ChartLegend
            series={[
              { name: "Deaths", color: chartColors.primary },
              { name: "Above threshold", color: "#F59E0B" },
            ]}
          />
          <BarChart
            labels={mortalityTrend.labels}
            ticks={mortalityTrend.ticks}
            max={mortalityTrend.max}
            height={160}
            barWidth={14}
            series={[
              {
                name: "Deaths",
                color: chartColors.primary,
                colors: mortalityTrend.colors,
                values: mortalityTrend.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Mortality by Cause"
            subtitle={`Last 30 days · ${count(causeTotal)} birds`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={mortalityByCause}
              size={150}
              caption={count(causeTotal)}
              captionLabel="birds"
            />
            <DonutLegend slices={mortalityByCause} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search by flock or cause…"
        filters={[
          {
            name: "house",
            label: "House",
            options: houses.map((house) => ({
              value: house.name,
              label: house.name,
            })),
          },
          {
            name: "flock",
            label: "Flock",
            options: flocks.map((flock) => ({
              value: flock.code,
              label: flock.code,
            })),
          },
          {
            name: "cause",
            label: "Cause",
            options: causes.map((cause) => ({ value: cause, label: cause })),
          },
          {
            name: "status",
            label: "Status",
            options: [
              { value: "pending", label: "Pending review" },
              { value: "reviewed", label: "Reviewed" },
              { value: "under_treatment", label: "Under treatment" },
              { value: "escalated", label: "Escalated" },
            ],
          },
        ]}
      />

      <Card className="flex flex-col">
        <PanelHead
          inset
          title="Mortality Records"
          subtitle="Most recent entries first"
        />
        <DataTable
          columns={columns}
          rows={mortalityRecords.rows}
          rowKey={(row, index) => `${row.flock}-${index}`}
        />
        <TableFooter summary={`Showing ${mortalityRecords.range} records`}>
          <Pager
            page={mortalityRecords.page}
            hasNext={mortalityRecords.hasNext}
            hasPrevious={mortalityRecords.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
