import { Calendar, ChevronDown, Plus, SlidersHorizontal } from "lucide-react";

import { BarChart, ChartLegend, chartColors } from "@/components/charts/bar-chart";
import { ProgressRail } from "@/components/charts/progress-rail";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { GhostButton } from "@/components/ui/ghost-button";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { SegmentedControl } from "@/components/ui/tabs";
import { toneBg, toneText } from "@/components/ui/tone";
import {
  attentionAlerts,
  dashboardKpis,
  financeChart,
  flockPerformance,
  houseOccupancy,
  productionChart,
  todaysTasks,
  type FlockRow,
} from "@/lib/data/dashboard";

const flockColumns: Column<FlockRow>[] = [
  {
    header: "Flock",
    cell: (row) => <CellStack primary={row.id} secondary={row.breed} />,
  },
  {
    header: "House",
    width: 76,
    cell: (row) => <CellText>{row.house}</CellText>,
  },
  {
    header: "Birds",
    width: 70,
    align: "right",
    cell: (row) => <CellText strong>{row.birds}</CellText>,
  },
  {
    header: "Age",
    width: 78,
    cell: (row) => <CellText>{row.age}</CellText>,
  },
  {
    header: "Mortality",
    width: 78,
    align: "right",
    cell: (row) => <CellText>{row.mortality}</CellText>,
  },
  {
    header: "Avg Weight",
    width: 84,
    align: "right",
    cell: (row) => <CellText>{row.weight}</CellText>,
  },
  {
    header: "Status",
    width: 96,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export default function DashboardPage() {
  const totalBirds = houseOccupancy.reduce((sum, h) => sum + h.current, 0);
  const totalCapacity = houseOccupancy.reduce((sum, h) => sum + h.capacity, 0);
  const utilisation = (totalBirds / totalCapacity) * 100;

  return (
    <>
      <PageHeader
        title="Good morning, Samuel"
        subtitle="Here's what's happening across Jayda Farms today."
      >
        <Button variant="secondary" icon={Calendar} trailingIcon={ChevronDown}>
          Today · 09 Aug 2026
        </Button>
        <Button icon={Plus}>Add Record</Button>
      </PageHeader>

      <KpiGrid>
        {dashboardKpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <h2 className="text-md font-semibold text-ink">
                Production Overview
              </h2>
              <p className="text-sm text-ink-2">
                Eggs produced vs eggs sold · last 7 days
              </p>
            </div>
            <SegmentedControl
              options={["7 days", "30 days", "3 months", "1 year"]}
            />
          </div>
          <ChartLegend
            series={[
              { name: "Eggs produced", color: chartColors.primary },
              { name: "Eggs sold", color: chartColors.soft },
            ]}
          />
          <BarChart
            labels={productionChart.labels}
            ticks={productionChart.ticks}
            max={productionChart.max}
            series={[
              {
                name: "Eggs produced",
                color: chartColors.primary,
                values: productionChart.produced,
              },
              {
                name: "Eggs sold",
                color: chartColors.soft,
                values: productionChart.sold,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[470px]">
          <div className="flex flex-col gap-[3px]">
            <h2 className="text-md font-semibold text-ink">
              Revenue vs Expenses
            </h2>
            <p className="text-sm text-ink-2">Last 6 months</p>
          </div>
          <ChartLegend
            series={[
              { name: "Revenue", color: chartColors.primary },
              { name: "Expenses", color: chartColors.soft },
              { name: "Profit", color: chartColors.success },
            ]}
          />
          <BarChart
            labels={financeChart.labels}
            ticks={financeChart.ticks}
            max={financeChart.max}
            barWidth={12}
            series={[
              {
                name: "Revenue",
                color: chartColors.primary,
                values: financeChart.revenue,
              },
              {
                name: "Expenses",
                color: chartColors.soft,
                values: financeChart.expenses,
              },
              {
                name: "Profit",
                color: chartColors.success,
                values: financeChart.profit,
              },
            ]}
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-3.5">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <h2 className="text-md font-semibold text-ink">
                  Flock Performance
                </h2>
                <p className="text-sm text-ink-2">
                  8 active flocks across 4 houses
                </p>
              </div>
              <GhostButton icon={SlidersHorizontal}>Filter</GhostButton>
              <GhostButton>View all</GhostButton>
            </div>
            <DataTable
              columns={flockColumns}
              rows={flockPerformance}
              rowKey={(row) => row.id}
            />
            <TableFooter summary="Showing 5 of 8 flocks">
              <GhostButton>Previous</GhostButton>
              <GhostButton>Next</GhostButton>
            </TableFooter>
          </Card>

          <Card className="flex flex-col gap-3.5 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <h2 className="text-md font-semibold text-ink">
                  House Occupancy
                </h2>
                <p className="text-sm text-ink-2">
                  {totalBirds.toLocaleString("en-US")} of{" "}
                  {totalCapacity.toLocaleString("en-US")} total capacity ·{" "}
                  {utilisation.toFixed(1)}% utilised
                </p>
              </div>
              <span className="text-md font-semibold text-violet-deep">
                {utilisation.toFixed(1)}%
              </span>
            </div>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {houseOccupancy.map((house) => (
                <div key={house.house} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-sm-plus font-medium text-ink">
                      {house.house}
                    </span>
                    <span className="text-xs text-ink-3">
                      {house.current} / {house.capacity}
                    </span>
                  </div>
                  <ProgressRail
                    value={(house.current / house.capacity) * 100}
                    color={
                      house.tone === "warning"
                        ? chartColors.warning
                        : chartColors.primary
                    }
                    height={6}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 xl:w-[470px]">
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <h2 className="flex-1 text-md font-semibold text-ink">
                Attention Required
              </h2>
              <Badge tone="error" dot={false}>
                3 active
              </Badge>
            </div>
            {attentionAlerts.map((alert) => (
              <div
                key={alert.title}
                className="flex items-center gap-3 rounded-[10px] border border-border-soft bg-bg p-3"
              >
                <IconChip icon={alert.icon} tone={alert.tone} size={32} />
                <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm-plus font-semibold text-ink">
                      {alert.title}
                    </span>
                    <span className="text-xs text-ink-3">{alert.time}</span>
                  </div>
                  <p className="text-sm leading-[1.45] text-ink-2">
                    {alert.description}
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-md border border-border-hair bg-card px-2.5 py-[5px] text-xs-plus font-semibold text-violet-deep"
                >
                  {alert.action}
                </button>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-2 p-4">
            <div className="flex items-center gap-3">
              <h2 className="flex-1 text-md font-semibold text-ink">
                Today&apos;s Tasks
              </h2>
              <span className="text-xs-plus text-ink-3">2 of 5 done</span>
            </div>
            {todaysTasks.map((task) => (
              <div key={task.title} className="flex items-center gap-2.5 py-1.5">
                <span
                  className={`flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] ${
                    task.done
                      ? "border-violet bg-violet"
                      : "border-border-hair bg-card"
                  }`}
                >
                  {task.done ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="size-3 stroke-white"
                      fill="none"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : null}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    className={`truncate text-sm-plus font-medium ${
                      task.done ? "text-ink-3 line-through" : "text-ink"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className="truncate text-xs text-ink-3">
                    {task.meta}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-[3px] text-2xs font-semibold ${toneBg[task.tone]} ${toneText[task.tone]}`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
