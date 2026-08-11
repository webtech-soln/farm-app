import {
  Banknote,
  Beef,
  Bird,
  Box,
  Egg,
  FileText,
  Layers,
  Package,
  Percent,
  Plus,
  ShoppingBag,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { GhostButton } from "@/components/ui/ghost-button";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  productPerformance,
  products,
  type ProductIcon,
  type ProductPerformance,
} from "@/lib/data/products";

const productIcons: Record<ProductIcon, LucideIcon> = {
  package: Package,
  egg: Egg,
  bird: Bird,
  sprout: Sprout,
  layers: Layers,
  beef: Beef,
};

const columns: Column<ProductPerformance>[] = [
  {
    header: "PRODUCT",
    cell: (row) => <CellText strong>{row.name}</CellText>,
  },
  {
    header: "UNITS SOLD",
    width: 110,
    cell: (row) => <CellText strong>{row.units}</CellText>,
  },
  {
    header: "REVENUE",
    width: 110,
    cell: (row) => <CellText strong>{row.revenue}</CellText>,
  },
  {
    header: "COST",
    width: 100,
    cell: (row) => <CellText>{row.cost}</CellText>,
    hideBelow: "md",
  },
  {
    header: "MARGIN",
    width: 100,
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${
          row.marginTone ? toneText[row.marginTone] : "text-ink"
        }`}
      >
        {row.margin}
      </span>
    ),
  },
  {
    header: "ORDERS",
    width: 90,
    cell: (row) => <CellText strong>{row.orders}</CellText>,
    hideBelow: "md",
  },
  {
    header: "TREND",
    width: 120,
    cell: (row) => <Badge tone={row.trendTone}>{row.trend}</Badge>,
  },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        breadcrumb={["Sales", "Products"]}
        subtitle="Everything Jayda Farms sells, with live availability and pricing."
      >
        <Button variant="secondary" icon={FileText}>
          Price list
        </Button>
        <Button icon={Plus}>Add Product</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Products"
          icon={Box}
          value="6"
          delta="+1"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="1 added this month"
        />
        <KpiCard
          label="Units Sold (month)"
          icon={ShoppingBag}
          value="41,200"
          delta="+8.4%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Average Margin"
          icon={Percent}
          value="32.4%"
          delta="+1.1pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
        <KpiCard
          label="Revenue (month)"
          icon={Banknote}
          value="$24,820"
          delta="+12.4%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const Icon = productIcons[product.icon];
          return (
            <Card key={product.name} className="flex flex-col gap-3.5 p-4">
              <div className="flex items-center gap-3">
                <IconChip icon={Icon} size={40} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-lg font-semibold text-ink">
                    {product.name}
                  </span>
                  <span className="truncate text-xs-plus text-ink-3">
                    {product.category}
                  </span>
                </div>
                <Badge tone={product.statusTone}>{product.status}</Badge>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-[20px] font-semibold tracking-[-0.4px] text-ink">
                  {product.price}
                </span>
                <span className="text-xs-plus text-ink-3">{product.unit}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`flex-1 text-sm-plus font-medium ${
                    product.availableTone
                      ? toneText[product.availableTone]
                      : "text-ink-2"
                  }`}
                >
                  {product.available}
                </span>
                <span className="text-xs-plus text-ink-3">{product.note}</span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col">
        <PanelHead inset title="Product Performance" subtitle="Last 30 days" />
        <DataTable
          columns={columns}
          rows={productPerformance}
          rowKey={(row) => row.name}
        />
        <TableFooter summary="6 products">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
