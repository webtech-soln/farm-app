import Link from "next/link";
import {
  Bird,
  Download,
  Droplets,
  HeartPulse,
  Layers,
  LayoutGrid,
  Plus,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Warehouse,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { ColumnChart } from "@/components/charts/column-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { ProgressRail } from "@/components/charts/progress-rail";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { MetricStrip } from "@/components/ui/metric-strip";
import { farmSummary, healthDistribution, houses } from "@/lib/data/houses";

const summaryIcons: Record<string, LucideIcon> = {
  warehouse: Warehouse,
  "layout-grid": LayoutGrid,
  bird: Bird,
  layers: Layers,
  "heart-pulse": HeartPulse,
  "shield-check": ShieldCheck,
};

export default function HousesPage() {
  return (
    <>
      <PageHeader title="Farm Overview" breadcrumb={["Farm", "Overview"]}>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add House</Button>
      </PageHeader>

      <MetricStrip
        metrics={farmSummary.map((item) => ({
          label: item.label,
          value: item.value,
          icon: summaryIcons[item.icon],
          valueTone: item.accent ? ("success" as const) : undefined,
        }))}
      />

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {houses.map((house) => (
          <Card key={house.id} className="flex flex-col gap-3.5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  href={`/houses/${house.id}`}
                  className="text-[16px] font-semibold text-ink hover:text-violet-deep"
                >
                  {house.name}
                </Link>
                <span className="truncate text-xs-plus text-ink-2">
                  {house.flock}
                </span>
              </div>
              <Badge tone={house.statusTone}>{house.status}</Badge>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm-plus font-medium text-ink">
                  {house.birds} / {house.capacity} birds
                </span>
                <span className="text-xs-plus font-semibold text-ink-2">
                  {house.occupancy}%
                </span>
              </div>
              <ProgressRail
                value={house.occupancy}
                color={house.railTone === "warning" ? "#B45309" : "#7C3AED"}
                height={6}
              />
            </div>

            <div className="flex gap-4">
              <HouseMetric
                icon={Thermometer}
                label="Temp"
                value={`${house.temp}°C`}
                warn={house.tempOutOfBand}
              />
              <HouseMetric
                icon={Droplets}
                label="Humidity"
                value={`${house.humidity}%`}
              />
              <HouseMetric
                icon={Wheat}
                label="Feed today"
                value={`${house.feedToday} kg`}
              />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Temperature by House"
            subtitle="Current reading · optimal band 24–30°C"
          >
            <span className="flex items-center gap-1.5 rounded-full bg-warning-bg px-2.5 py-1 text-xs-plus font-semibold text-warning">
              <TriangleAlert className="size-3.5" />2 out of band
            </span>
          </PanelHead>
          <ColumnChart
            ticks={["36°", "27°", "18°", "9°", "0°"]}
            max={36}
            data={houses.map((house) => ({
              label: house.name.replace("House ", "H"),
              value: house.temp,
              display: `${house.temp}°`,
              color: house.tempOutOfBand ? "#F59E0B" : "#7C3AED",
              labelClassName: house.tempOutOfBand
                ? "text-xs font-semibold text-warning"
                : "text-xs font-semibold text-ink-2",
            }))}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <PanelHead
            title="Flock Health Distribution"
            subtitle="8 active flocks"
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={healthDistribution}
              caption="8"
              captionLabel="flocks"
            />
            <DonutLegend slices={healthDistribution} />
          </div>
        </Card>
      </div>
    </>
  );
}

function HouseMetric({
  icon: Icon,
  label,
  value,
  warn,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="flex items-center gap-1">
        <Icon className="size-3 text-ink-3" />
        <span className="text-2xs text-ink-3">{label}</span>
      </span>
      <span
        className={`text-base-plus font-semibold ${warn ? "text-warning" : "text-ink"}`}
      >
        {value}
      </span>
    </div>
  );
}
