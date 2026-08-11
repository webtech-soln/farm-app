import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Download,
  HeartPulse,
  Plus,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
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
import { FilterBar } from "@/components/ui/filter-bar";
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  mortalityByCause,
  mortalityRecords,
  mortalityTrend,
  type MortalityRecord,
} from "@/lib/data/mortality";

const columns: Column<MortalityRecord>[] = [
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
];

export default function MortalityPage() {
  return (
    <>
      <PageHeader
        title="Mortality Overview"
        breadcrumb={["Operations", "Mortality"]}
        subtitle="Track losses by flock, house and cause across the farm."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Record Mortality</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Today"
          icon={CalendarDays}
          value="21 birds"
          delta="↓ 19%"
          deltaIcon={TrendingDown}
          deltaTone="success"
          note="vs 26 yesterday"
        />
        <KpiCard
          label="This Week"
          icon={CalendarRange}
          value="118 birds"
          delta="+6.3%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last week"
        />
        <KpiCard
          label="This Month"
          icon={Calendar}
          value="486 birds"
          delta="+2.1%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last month"
        />
        <KpiCard
          label="Mortality Rate"
          icon={HeartPulse}
          iconTone="warning"
          value="1.8%"
          delta="Near limit"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="threshold 2.0%"
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
            subtitle="Last 30 days · 486 birds"
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={mortalityByCause}
              size={150}
              caption="486"
              captionLabel="birds"
            />
            <DonutLegend slices={mortalityByCause} />
          </div>
        </Card>
      </div>

      <FilterBar
        placeholder="Search by flock or cause…"
        selects={["House", "Flock", "Cause", "Date range"]}
      />

      <Card className="flex flex-col">
        <PanelHead
          inset
          title="Mortality Records"
          subtitle="Most recent entries first"
        />
        <DataTable
          columns={columns}
          rows={mortalityRecords}
          rowKey={(row, index) => `${row.flock}-${index}`}
        />
        <TableFooter summary="Showing 6 of 128 records">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
