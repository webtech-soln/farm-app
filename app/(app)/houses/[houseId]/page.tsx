import { notFound } from "next/navigation";
import {
  Bird,
  ChevronDown,
  Download,
  Droplets,
  HeartPulse,
  Layers,
  LayoutGrid,
  Pencil,
  Plus,
  Thermometer,
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
  birdCountTrend,
  feedConsumption,
  houseActivity,
  temperatureDay,
} from "@/lib/data/house-detail";
import { houses } from "@/lib/data/houses";

export function generateStaticParams() {
  return houses.map((house) => ({ houseId: house.id }));
}

export default async function HouseDetailPage({
  params,
}: PageProps<"/houses/[houseId]">) {
  const { houseId } = await params;
  const house = houses.find((entry) => entry.id === houseId);

  if (!house) notFound();

  return (
    <>
      <PageHeader
        title={house.name}
        breadcrumb={["Farm", "Houses", house.name]}
        subtitle={`${house.flock.includes("Layer") ? "Layer" : "Broiler"} house · ${house.capacity.toLocaleString("en-US")} bird capacity · commissioned Jan 2024`}
      >
        <Button variant="secondary" icon={Pencil}>
          Edit House
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Record</Button>
      </PageHeader>

      <MetricStrip
        metrics={[
          {
            label: "Birds",
            value: house.birds.toLocaleString("en-US"),
            icon: Bird,
          },
          {
            label: "Capacity",
            value: house.capacity.toLocaleString("en-US"),
            icon: LayoutGrid,
          },
          {
            label: "Temperature",
            value: `${house.temp}°C`,
            icon: Thermometer,
            valueTone: house.tempOutOfBand ? "warning" : undefined,
          },
          { label: "Humidity", value: `${house.humidity}%`, icon: Droplets },
          {
            label: "Current Flock",
            value: house.flock.split(" · ")[0],
            icon: Layers,
          },
          {
            label: "Mortality",
            value: "1.2%",
            icon: HeartPulse,
            valueTone: "success",
          },
        ]}
      />

      <Tabs
        tabs={["Overview", "Flock", "Production", "Feed", "Health", "History"]}
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Temperature · last 24 hours"
            subtitle="Optimal band 24–30°C · 2 excursions recorded"
          >
            <GhostButton icon={ChevronDown}>Last 24h</GhostButton>
          </PanelHead>
          <ChartLegend
            series={[
              { name: "Temperature", color: chartColors.primary },
              { name: "Above optimal", color: "#F59E0B" },
            ]}
          />
          <BarChart
            labels={temperatureDay.labels}
            ticks={temperatureDay.ticks}
            max={temperatureDay.max}
            height={160}
            barWidth={14}
            series={[
              {
                name: "Temperature",
                color: chartColors.primary,
                colors: temperatureDay.colors,
                values: temperatureDay.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Bird Count Trend"
            subtitle="Last 6 weeks · natural depletion"
          />
          <BarChart
            labels={birdCountTrend.labels}
            ticks={birdCountTrend.ticks}
            min={birdCountTrend.min}
            max={birdCountTrend.max}
            height={160}
            barWidth={22}
            series={[
              {
                name: "Birds",
                color: chartColors.primary,
                values: birdCountTrend.values,
              },
            ]}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Feed Consumption"
            subtitle="Daily intake vs standard curve · kg"
          />
          <ChartLegend
            series={[
              { name: "Actual intake", color: chartColors.primary },
              { name: "Standard", color: "#DDD6FE" },
            ]}
          />
          <BarChart
            labels={feedConsumption.labels}
            ticks={feedConsumption.ticks}
            max={feedConsumption.max}
            height={160}
            barWidth={18}
            series={[
              {
                name: "Actual intake",
                color: chartColors.primary,
                values: feedConsumption.actual,
              },
              {
                name: "Standard",
                color: "#DDD6FE",
                values: feedConsumption.standard,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead title="Recent Activity">
            <GhostButton>View all</GhostButton>
          </PanelHead>
          <Timeline events={houseActivity} />
        </Card>
      </div>
    </>
  );
}
