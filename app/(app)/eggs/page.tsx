import {
  CalendarRange,
  Egg,
  EggOff,
  Gauge,
  Minus,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import { Pager } from "@/components/ui/pager";
import { RangeSelect } from "@/components/ui/range-select";
import { KpiCard } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  DeleteEggCollectionDialog,
  EggCollectionDialog,
} from "@/components/dialogs/record-dialogs";
import { getFlockOptions } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { numberParam, pageWindow, paginate, param } from "@/lib/pagination";
import {
  getCollections,
  getEggKpis,
  getEggTrend,
  getGradeDistribution,
  getSizeBreakdown,
  type Collection,
} from "@/lib/data/eggs";
import { count, percent, signedPercent } from "@/lib/format";

const columns: Column<Collection>[] = [
  {
    header: "TIME",
    width: 130,
    cell: (row) => <CellStack primary={row.time} secondary={row.session} />,
  },
  {
    header: "HOUSE",
    width: 82,
    cell: (row) => <CellText>{row.house}</CellText>,
    hideBelow: "md",
  },
  {
    header: "FLOCK",
    width: 110,
    cell: (row) => <CellText strong>{row.flock}</CellText>,
  },
  {
    header: "COLLECTED",
    width: 92,
    align: "right",
    cell: (row) => <CellText strong>{row.collected}</CellText>,
  },
  {
    header: "BROKEN",
    width: 76,
    align: "right",
    cell: (row) => <CellText strong>{row.broken}</CellText>,
  },
  {
    header: "RATE",
    width: 76,
    align: "right",
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${
          row.rateTone === "ink" ? "text-ink" : toneText[row.rateTone]
        }`}
      >
        {row.rate}
      </span>
    ),
  },
  {
    header: "RECORDED BY",
    width: 118,
    cell: (row) => <CellText>{row.recordedBy}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "STATUS",
    width: 128,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
  {
    header: "",
    width: 48,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        <DeleteEggCollectionDialog id={row.id} />
      </div>
    ),
  },
];

export default async function EggsPage({
  searchParams,
}: PageProps<"/eggs">) {
  const params = await searchParams;
  const window = pageWindow(params);
  const days = numberParam(params, "days", 14, { min: 1, max: 365 });
  const filters = {
    search: param(params, "q"),
    house: param(params, "house"),
    session: param(params, "session"),
  };

  const [
    kpis,
    eggTrend,
    gradeDistribution,
    sizeBreakdown,
    rows,
    houses,
    flocks,
  ] = await Promise.all([
      getEggKpis(),
      getEggTrend(days),
      getGradeDistribution(),
      getSizeBreakdown(),
      getCollections(filters, window.limit, window.offset),
      getHouseOptions(),
      getFlockOptions({ activeOnly: true }),
    ]);

  const collections = paginate(rows, window);

  const change = (current: number, previous: number) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const dayChange = change(kpis.today, kpis.yesterday);
  const weekChange = change(kpis.week, kpis.previousWeek);
  const brokenChange = change(kpis.brokenToday, kpis.brokenYesterday);
  const gradedToday = gradeDistribution.reduce(
    (sum, slice) => sum + slice.value,
    0,
  );
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Egg Production"
        breadcrumb={["Operations", "Egg Production"]}
        subtitle="Collection, grading and wastage across layer houses."
      >
        <ExportButton board="eggs" />
        <EggCollectionDialog houses={houses} flocks={flocks} />
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Eggs Today"
          icon={Egg}
          value={count(kpis.today)}
          delta={signedPercent(dayChange)}
          deltaIcon={dayChange >= 0 ? TrendingUp : TrendingDown}
          deltaTone={dayChange >= 0 ? "success" : "warning"}
          note="vs yesterday"
        />
        <KpiCard
          label="Eggs This Week"
          icon={CalendarRange}
          value={count(kpis.week)}
          delta={signedPercent(weekChange)}
          deltaIcon={weekChange >= 0 ? TrendingUp : TrendingDown}
          deltaTone={weekChange >= 0 ? "success" : "warning"}
          note="vs last week"
        />
        <KpiCard
          label="Production Rate"
          icon={Gauge}
          iconTone={kpis.belowTarget ? "warning" : undefined}
          value={percent(kpis.henDayRate)}
          delta={kpis.belowTarget ? "Below target" : "On target"}
          deltaIcon={kpis.belowTarget ? TrendingDown : TrendingUp}
          deltaTone={kpis.belowTarget ? "warning" : "success"}
          note="hen-day average"
        />
        <KpiCard
          label="Broken Eggs"
          icon={EggOff}
          value={count(kpis.brokenToday)}
          delta={signedPercent(brokenChange)}
          deltaIcon={brokenChange <= 0 ? TrendingDown : TrendingUp}
          deltaTone={brokenChange <= 0 ? "success" : "warning"}
          note="vs yesterday"
        />
        <KpiCard
          label="Egg Wastage"
          icon={Trash2}
          iconTone={kpis.wastageRate > 2 ? "warning" : undefined}
          value={percent(kpis.wastageRate)}
          delta={kpis.wastageRate > 2 ? "High" : "Stable"}
          deltaIcon={kpis.wastageRate > 2 ? TrendingUp : Minus}
          deltaTone={kpis.wastageRate > 2 ? "warning" : "neutral"}
          note={
            kpis.wastageRate > 2 ? "above tolerance" : "within tolerance"
          }
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Daily Egg Production"
            subtitle="Collected vs sold · last 14 days"
          >
            <RangeSelect
              name="days"
              defaultValue="14"
              options={[
                { value: "7", label: "Last 7 days" },
                { value: "14", label: "Last 14 days" },
                { value: "30", label: "Last 30 days" },
              ]}
            />
          </PanelHead>
          <ChartLegend
            series={[
              { name: "Collected", color: chartColors.primary },
              { name: "Sold", color: chartColors.soft },
            ]}
          />
          <BarChart
            labels={eggTrend.labels}
            ticks={eggTrend.ticks}
            max={eggTrend.max}
            height={160}
            barWidth={9}
            series={[
              {
                name: "Collected",
                color: chartColors.primary,
                values: eggTrend.collected,
              },
              {
                name: "Sold",
                color: chartColors.soft,
                values: eggTrend.sold,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Egg Grade Distribution"
            subtitle="Today's collection"
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={gradeDistribution}
              size={150}
              caption={count(gradedToday)}
              captionLabel="eggs"
            />
            <DonutLegend slices={gradeDistribution} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {sizeBreakdown.map((item) => (
          <Card key={item.label} className="flex flex-col gap-1.5 p-4">
            <div className="flex items-center gap-2">
              <span className="flex-1 text-xs-plus font-medium text-ink-2">
                {item.label}
              </span>
              {item.chip ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-3xs font-semibold ${
                    item.chipAccent
                      ? "bg-violet-light text-violet-deep"
                      : "bg-border-soft text-ink-2"
                  }`}
                >
                  {item.chip}
                </span>
              ) : null}
            </div>
            <span className="text-[20px] font-semibold text-ink">
              {item.value}
            </span>
            <span className="text-xs text-ink-3">{item.note}</span>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col">
        <PanelHead
          inset
          title="Collection Records"
          subtitle={`Today · ${today}`}
        />
        <DataTable
          columns={columns}
          rows={collections.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${collections.range} collections`}>
          <Pager
            page={collections.page}
            hasNext={collections.hasNext}
            hasPrevious={collections.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
