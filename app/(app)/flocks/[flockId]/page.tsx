import { notFound } from "next/navigation";
import {
  Bird,
  CalendarClock,
  Download,
  Gauge,
  HeartPulse,
  PackagePlus,
  Pencil,
  Plus,
  Scale,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { GhostButton } from "@/components/ui/ghost-button";
import { MetricStrip } from "@/components/ui/metric-strip";
import { Tabs } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import {
  birdPopulation,
  flockActivity,
  flockFeed,
  flockFinancials,
  flockMortality,
  weightGrowth,
} from "@/lib/data/flock-detail";
import { flocks } from "@/lib/data/flocks";

export function generateStaticParams() {
  return flocks.map((flock) => ({ flockId: flock.id }));
}

export default async function FlockDetailPage({
  params,
}: PageProps<"/flocks/[flockId]">) {
  const { flockId } = await params;
  const flock = flocks.find((entry) => entry.id === flockId);

  if (!flock) notFound();

  return (
    <>
      <PageHeader
        title={`Flock ${flock.id}`}
        breadcrumb={["Farm", "Flocks", flock.id]}
        subtitle={`${flock.breed} · ${flock.type} · ${flock.house} · placed ${flock.started.replace(/^Started /, "")}`}
      >
        <Button variant="secondary" icon={Pencil}>
          Edit Flock
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Record</Button>
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
            valueTone: "success",
          },
          { label: "Avg Weight", value: flock.weight, icon: Scale },
          { label: "FCR", value: "1.62", icon: Gauge },
        ]}
      />

      <Tabs
        tabs={[
          "Overview",
          "Daily Records",
          "Feed",
          "Weight",
          "Health",
          "Mortality",
          "Production",
          "Financials",
        ]}
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Weight Growth"
            subtitle="Sampled average vs Cobb 500 standard · kg"
          >
            <span className="rounded-full bg-violet-light px-2.5 py-1 text-xs-plus font-semibold text-violet-deep">
              +0.06 kg vs standard
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

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Bird Population"
            subtitle="Weekly count · 80 birds lost since placement"
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
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Feed Consumption"
            subtitle="Daily intake · kg · cumulative 12,480 kg"
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

        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Mortality"
            subtitle="Weekly deaths · threshold 15/week"
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
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead title="Activity Timeline">
            <GhostButton icon={SlidersHorizontal}>Filter</GhostButton>
          </PanelHead>
          <Timeline events={flockActivity} />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Flock Financials"
            subtitle="Projected cycle margin"
          />
          <dl className="flex flex-col gap-2.5">
            {flockFinancials.map((line) => (
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
              34.7%
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
