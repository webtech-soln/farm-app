import {
  Banknote,
  ChevronDown,
  CreditCard,
  Download,
  FileMinus,
  Package,
  Percent,
  Plus,
  Receipt,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  BarChart,
  ChartLegend,
  chartColors,
} from "@/components/charts/bar-chart";
import { Donut, DonutLegend } from "@/components/charts/donut";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  cashPosition,
  expensesByCategory,
  monthlyProfit,
  revenueVsExpenses,
  workingCapital,
  type CashLine,
} from "@/lib/data/finance";

const cashIcons: Record<CashLine["icon"], LucideIcon> = {
  wallet: Wallet,
  "credit-card": CreditCard,
  "file-minus": FileMinus,
  package: Package,
};

const compareSeries = [
  {
    name: "Revenue",
    color: chartColors.primary,
    values: revenueVsExpenses.revenue,
  },
  { name: "Expenses", color: "#DDD6FE", values: revenueVsExpenses.expenses },
  { name: "Profit", color: "#16A34A", values: revenueVsExpenses.profit },
];

export default function FinancePage() {
  return (
    <>
      <PageHeader
        title="Finance Dashboard"
        breadcrumb={["Finance"]}
        subtitle="Revenue, cost and profitability across the whole operation."
      >
        <Button variant="secondary" icon={ChevronDown}>
          This year
        </Button>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Transaction</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Revenue (month)"
          icon={Banknote}
          value="$24,820"
          delta="+12.4%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Expenses (month)"
          icon={Receipt}
          value="$16,450"
          delta="+4.2%"
          deltaIcon={TrendingUp}
          deltaTone="error"
          note="vs last month"
        />
        <KpiCard
          label="Net Profit"
          icon={Wallet}
          value="$8,370"
          delta="+18.7%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Profit Margin"
          icon={Percent}
          value="33.7%"
          delta="+1.9pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Revenue vs Expenses"
            subtitle="Last 8 months · $ thousands"
          >
            <ChartLegend series={compareSeries} />
          </PanelHead>
          <BarChart
            labels={revenueVsExpenses.labels}
            ticks={revenueVsExpenses.ticks}
            max={revenueVsExpenses.max}
            height={160}
            barWidth={11}
            series={compareSeries}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead
            title="Expenses by Category"
            subtitle="August 2026 · $16,450"
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={expensesByCategory}
              size={150}
              caption="$16.5k"
              captionLabel="spend"
            />
            <DonutLegend slices={expensesByCategory} />
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Monthly Profit"
            subtitle="Net profit after all costs · $ thousands"
          >
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs-plus font-semibold text-violet-deep">
              +18.7% MoM
            </span>
          </PanelHead>
          <BarChart
            labels={monthlyProfit.labels}
            ticks={monthlyProfit.ticks}
            max={monthlyProfit.max}
            height={150}
            barWidth={44}
            series={[
              {
                name: "Profit",
                color: chartColors.primary,
                values: monthlyProfit.values,
              },
            ]}
          />
        </Card>

        <Card className="flex flex-col gap-4 p-4 xl:w-[440px]">
          <PanelHead title="Cash Position" subtitle="As at 09 August 2026" />
          <ul className="flex flex-col gap-4">
            {cashPosition.map((line) => (
              <li key={line.label} className="flex items-center gap-2.5">
                <IconChip icon={cashIcons[line.icon]} />
                <span className="min-w-0 flex-1 truncate text-sm-plus text-ink-2">
                  {line.label}
                </span>
                <span
                  className={`text-base-plus font-semibold ${
                    line.tone ? toneText[line.tone] : "text-ink"
                  }`}
                >
                  {line.value}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 rounded-[10px] bg-violet-50 p-3.5">
            <span className="flex-1 text-sm-plus font-medium text-violet-deep">
              Working capital
            </span>
            <span className="text-[17px] font-semibold text-violet-deep">
              {workingCapital}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
