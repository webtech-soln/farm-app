import {
  Banknote,
  CreditCard,
  FileMinus,
  Package,
  Percent,
  ReceiptCent,
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
import { ExpenseDialog } from "@/components/dialogs/finance-dialogs";
import { PaymentDialog } from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { getCustomerOptions } from "@/lib/data/customers";
import { getOpenOrderOptions } from "@/lib/data/orders";
import { getSupplierOptions } from "@/lib/data/suppliers";
import { Card, PanelHead } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  getCashPosition,
  getExpensesByCategory,
  getFinanceKpis,
  getMonthlyProfit,
  getRevenueVsExpenses,
  type CashLine,
} from "@/lib/data/finance";
import { money, percent, signedPercent } from "@/lib/format";

const cashIcons: Record<CashLine["icon"], LucideIcon> = {
  wallet: Wallet,
  "credit-card": CreditCard,
  "file-minus": FileMinus,
  package: Package,
};

export default async function FinancePage() {
  const [
    kpis,
    revenueVsExpenses,
    monthlyProfit,
    expensesByCategory,
    cash,
    suppliers,
    openOrders,
    customers,
  ] = await Promise.all([
    getFinanceKpis(),
    getRevenueVsExpenses(),
    getMonthlyProfit(),
    getExpensesByCategory(),
    getCashPosition(),
    getSupplierOptions(),
    getOpenOrderOptions(),
    getCustomerOptions(),
  ]);

  const compareSeries = [
    {
      name: "Revenue",
      color: chartColors.primary,
      values: revenueVsExpenses.revenue,
    },
    { name: "Expenses", color: "#DDD6FE", values: revenueVsExpenses.expenses },
    { name: "Profit", color: "#16A34A", values: revenueVsExpenses.profit },
  ];
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <PageHeader
        title="Finance Dashboard"
        breadcrumb={["Finance"]}
        subtitle="Revenue, cost and profitability across the whole operation."
      >
        <ExportButton board="expenses" />
        <PaymentDialog
          orders={openOrders}
          customers={customers}
          label="Record Payment"
        />
        <ExpenseDialog suppliers={suppliers} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Revenue (month)"
          icon={Banknote}
          value={kpis.revenueLabel}
          delta={signedPercent(kpis.revenueChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.revenueChangePct >= 0 ? "success" : "warning"}
          note="vs last month"
        />
        <KpiCard
          label="Expenses (month)"
          icon={ReceiptCent}
          value={kpis.expensesLabel}
          delta={signedPercent(kpis.expensesChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.expensesChangePct > 0 ? "error" : "success"}
          note="vs last month"
        />
        <KpiCard
          label="Net Profit"
          icon={Wallet}
          value={kpis.profitLabel}
          delta={signedPercent(kpis.profitChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.profit >= 0 ? "success" : "error"}
          note="vs last month"
        />
        <KpiCard
          label="Profit Margin"
          icon={Percent}
          value={percent(kpis.margin)}
          delta={`${kpis.marginChangePp >= 0 ? "+" : ""}${kpis.marginChangePp.toFixed(1)}pp`}
          deltaIcon={TrendingUp}
          deltaTone={kpis.marginChangePp >= 0 ? "success" : "warning"}
          note="vs last month"
        />
      </KpiGrid>

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex flex-1 flex-col gap-4 p-4">
          <PanelHead
            title="Revenue vs Expenses"
            subtitle="Last 8 months · ₵ thousands"
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
            subtitle={`This month · ${kpis.expensesLabel}`}
          />
          <div className="flex flex-wrap items-center gap-6">
            <Donut
              slices={expensesByCategory}
              size={150}
              caption={money(kpis.expenses / 100, { compact: true })}
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
            subtitle="Net profit after all costs · ₵ thousands"
          >
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs-plus font-semibold text-violet-deep">
              {signedPercent(kpis.profitChangePct)} MoM
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
          <PanelHead title="Cash Position" subtitle={`As at ${today}`} />
          <ul className="flex flex-col gap-4">
            {cash.lines.map((line) => (
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
              {cash.workingCapital}
            </span>
          </div>
        </Card>
      </div>
    </>
  );
}
