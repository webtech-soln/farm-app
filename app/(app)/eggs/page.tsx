import {
  CalendarRange,
  ChevronDown,
  Download,
  Egg,
  EggOff,
  Gauge,
  Minus,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
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
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  collections,
  eggTrend,
  gradeDistribution,
  sizeBreakdown,
  type Collection,
} from "@/lib/data/eggs";

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
];

export default function EggsPage() {
  return (
    <>
      <PageHeader
        title="Egg Production"
        breadcrumb={["Operations", "Egg Production"]}
        subtitle="Collection, grading and wastage across layer houses."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Record Eggs</Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Eggs Today"
          icon={Egg}
          value="18,420"
          delta="+5.8%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs yesterday"
        />
        <KpiCard
          label="Eggs This Week"
          icon={CalendarRange}
          value="127,340"
          delta="+3.1%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last week"
        />
        <KpiCard
          label="Production Rate"
          icon={Gauge}
          value="87.4%"
          delta="+1.2pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="hen-day average"
        />
        <KpiCard
          label="Broken Eggs"
          icon={EggOff}
          value="214"
          delta="↓ 8%"
          deltaIcon={TrendingDown}
          deltaTone="success"
          note="vs yesterday"
        />
        <KpiCard
          label="Egg Wastage"
          icon={Trash2}
          value="1.2%"
          delta="stable"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="within tolerance"
        />
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Daily Egg Production"
            subtitle="Collected vs sold · last 14 days"
          >
            <GhostButton icon={ChevronDown}>Last 14 days</GhostButton>
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
              caption="18,420"
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
          subtitle="Today · 09 August 2026"
        />
        <DataTable
          columns={columns}
          rows={collections}
          rowKey={(row, index) => `${row.time}-${index}`}
        />
        <TableFooter summary="Showing 6 of 6 collections today">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
