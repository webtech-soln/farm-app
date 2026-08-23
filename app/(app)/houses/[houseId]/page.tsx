import { notFound } from "next/navigation";
import {
  Bird,
  Droplets,
  HeartPulse,
  Layers,
  LayoutGrid,
  Plus,
  Thermometer,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { HouseFormDialog } from "@/components/dialogs/house-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { ButtonLink } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { MetricStrip } from "@/components/ui/metric-strip";
import { Tabs } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import {
  getHouseActivity,
  getHouseBirdCountTrend,
  getHouseFeedConsumption,
  getHouseTemperatureDay,
} from "@/lib/data/house-detail";
import { getHouses } from "@/lib/data/houses";

export default async function HouseDetailPage({
  params,
}: PageProps<"/houses/[houseId]">) {
  const { houseId } = await params;
  const house = (await getHouses()).find((entry) => entry.id === houseId);

  if (!house) notFound();

  const [temperatureDay, birdCountTrend, feedConsumption, houseActivity] =
    await Promise.all([
      getHouseTemperatureDay(house.dbId),
      getHouseBirdCountTrend(house.dbId),
      getHouseFeedConsumption(house.dbId),
      getHouseActivity(house.dbId),
    ]);

  return (
    <>
      <PageHeader
        title={house.name}
        breadcrumb={["Farm", "Houses", house.name]}
        subtitle={`${house.flock.includes("Layer") ? "Layer" : "Broiler"} house · ${house.capacity.toLocaleString("en-US")} bird capacity`}
      >
        <HouseFormDialog house={house} labelled />
        <ExportButton board="houses" />
        <ButtonLink href={`/records/daily?house=${house.id}`} icon={Plus}>
          Add Record
        </ButtonLink>
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
            value: house.mortality,
            icon: HeartPulse,
            valueTone: "success",
          },
        ]}
      />

      <Tabs tabs={["Environment", "Birds", "Feed", "Activity"]} />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4" id="environment">
          <PanelHead
            title="Temperature · last 24 hours"
            subtitle={`Optimal band ${temperatureDay.band} · ${temperatureDay.excursions} excursions recorded`}
          >
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

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]" id="birds">
          <PanelHead
            title="Bird Count Trend"
            subtitle={`Last ${birdCountTrend.days} days · natural depletion`}
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
        <Card className="flex flex-1 flex-col gap-4 p-4" id="feed">
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

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]" id="activity">
          <PanelHead title="Recent Activity">
            <ButtonLink
              href={`/records/daily?house=${house.code}`}
              variant="ghost"
            >
              View all
            </ButtonLink>
          </PanelHead>
          <Timeline events={houseActivity} />
        </Card>
      </div>
    </>
  );
}
