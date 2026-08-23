import { notFound } from "next/navigation";
import {
  Bird,
  CalendarClock,
  Gauge,
  HeartPulse,
  PackagePlus,
  Plus,
  Scale,
  TrendingUp,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { FlockFormDialog } from "@/components/dialogs/flock-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { ButtonLink } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { MetricStrip } from "@/components/ui/metric-strip";
import { Tabs } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import { getFlockFormValues } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import {
  getFlockActivity,
  getFlockDetail,
  getFlockFeedTrend,
  getFlockFinancials,
  getFlockMortalityTrend,
  getFlockPopulation,
  getFlockWeightGrowth,
} from "@/lib/data/flock-detail";
import { count } from "@/lib/format";

export default async function FlockDetailPage({
  params,
}: PageProps<"/flocks/[flockId]">) {
  const { flockId } = await params;
  const flock = await getFlockDetail(flockId);

  if (!flock) notFound();

  const [
    weightGrowth,
    birdPopulation,
    flockFeed,
    flockMortality,
    flockActivity,
    financials,
    houses,
    formValues,
  ] = await Promise.all([
    getFlockWeightGrowth(flock.id),
    getFlockPopulation(flock.id),
    getFlockFeedTrend(flock.id),
    getFlockMortalityTrend(flock.id),
    getFlockActivity(flock.id),
    getFlockFinancials(flock.id),
    getHouseOptions(),
    getFlockFormValues(),
  ]);

  return (
    <>
      <PageHeader
        title={`Flock ${flock.code}`}
        breadcrumb={["Farm", "Flocks", flock.code]}
        subtitle={`${flock.breed} · ${flock.typeLabel} · ${flock.house} · placed ${flock.started}`}
      >
        <FlockFormDialog
          houses={houses}
          flock={formValues.get(flock.id)}
          labelled
        />
        <ExportButton board="flocks" />
        <ButtonLink href={`/records/daily?flock=${flock.code}`} icon={Plus}>
          Add Record
        </ButtonLink>
      </PageHeader>

      <MetricStrip
        metrics={[
          { label: "Age", value: flock.age, icon: CalendarClock },
          { label: "Current Birds", value: flock.current, icon: Bird },
          { label: "Initial Birds", value: flock.initial, icon: PackagePlus },
          {
            label: "Mortality",
            value: flock.mortality,
            icon: HeartPulse,
            valueTone: flock.mortalityPct >= 3 ? "warning" : "success",
          },
          { label: "Avg Weight", value: flock.weight, icon: Scale },
          { label: "FCR", value: flock.fcr, icon: Gauge },
        ]}
      />

      <Tabs
        tabs={["Weight", "Population", "Feed", "Mortality", "Activity", "Financials"]}
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4" id="weight">
          <PanelHead
            title="Weight Growth"
            subtitle="Sampled average vs Cobb 500 standard · kg"
          >
            <span className="rounded-full bg-violet-light px-2.5 py-1 text-xs-plus font-semibold text-violet-deep">
              {weightGrowth.varianceLabel}
            </span>
          </PanelHead>
          <ChartLegend
            series={[
              { name: "Actual", color: chartColors.primary },
              { name: "Standard", color: "#DDD6FE" },
            ]}
          />
          <BarChart
            labels={weightGrowth.labels}
            ticks={weightGrowth.ticks}
            max={weightGrowth.max}
            height={160}
            series={[
              {
                name: "Actual",
                color: chartColors.primary,
                values: weightGrowth.actual,
              },
              {
                name: "Standard",
                color: "#DDD6FE",
                values: weightGrowth.standard,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]" id="population">
          <PanelHead
            title="Bird Population"
            subtitle={`Daily closing count · ${count(flock.lost)} birds lost since placement`}
          />
          <BarChart
            labels={birdPopulation.labels}
            ticks={birdPopulation.ticks}
            min={birdPopulation.min}
            max={birdPopulation.max}
            height={160}
            barWidth={22}
            series={[
              {
                name: "Birds",
                color: chartColors.primary,
                values: birdPopulation.values,
              },
            ]}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4" id="feed">
          <PanelHead
            title="Feed Consumption"
            subtitle={`Daily intake · kg · cumulative ${count(flock.feedKg)} kg`}
          />
          <BarChart
            labels={flockFeed.labels}
            ticks={flockFeed.ticks}
            max={flockFeed.max}
            height={160}
            barWidth={22}
            series={[
              {
                name: "Feed",
                color: chartColors.primary,
                values: flockFeed.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-1 flex-col gap-4 p-4" id="mortality">
          <PanelHead
            title="Mortality"
            subtitle={`Daily deaths · ${count(flockMortality.total)} in the last 14 days`}
          />
          <BarChart
            labels={flockMortality.labels}
            ticks={flockMortality.ticks}
            max={flockMortality.max}
            height={160}
            barWidth={22}
            series={[
              {
                name: "Deaths",
                color: chartColors.primary,
                values: flockMortality.values,
              },
            ]}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4" id="activity">
          <PanelHead title="Activity Timeline">
            <ButtonLink
              href={`/records/mortality?flock=${flock.code}`}
              variant="ghost"
            >
              Mortality log
            </ButtonLink>
          </PanelHead>
          <Timeline events={flockActivity} />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]" id="financials">
          <PanelHead
            title="Flock Financials"
            subtitle="Projected cycle margin"
          />
          <dl className="flex flex-col gap-2.5">
            {financials.lines.map((line) => (
              <div
                key={line.label}
                className={`flex items-center gap-3 ${
                  line.strong ? "border-t border-border-soft pt-2.5" : ""
                }`}
              >
                <dt
                  className={`flex-1 text-sm-plus ${
                    line.strong ? "font-semibold text-ink" : "text-ink-2"
                  }`}
                >
                  {line.label}
                </dt>
                <dd
                  className={`text-base font-semibold ${
                    line.tone === "success"
                      ? "text-success"
                      : line.tone === "violet"
                        ? "text-violet-deep"
                        : "text-ink"
                  }`}
                >
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2 rounded-nav bg-violet-50 px-3 py-2.5">
            <TrendingUp className="size-4 text-violet-deep" />
            <span className="flex-1 text-sm-plus font-medium text-violet-deep">
              Projected margin
            </span>
            <span className="text-[14px] font-semibold text-violet-deep">
              {financials.marginLabel}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
