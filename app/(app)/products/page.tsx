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
  ShoppingBag,
  Sprout,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import {
  ArchiveProductDialog,
  ProductDialog,
} from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { paginateAll } from "@/lib/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { Pager } from "@/components/ui/pager";
import { IconChip } from "@/components/ui/icon-chip";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  getProductKpis,
  getProductPerformance,
  getProducts,
  type ProductIcon,
  type ProductPerformanceRow,
  getProductFormValues,
  type ProductFormValues,
} from "@/lib/data/products";
import { count, money, percent, signedPercent } from "@/lib/format";
import { requirePageAccess } from "@/lib/auth/route-access";

const productIcons: Record<ProductIcon, LucideIcon> = {
  package: Package,
  egg: Egg,
  bird: Bird,
  sprout: Sprout,
  layers: Layers,
  beef: Beef,
};

function buildColumns(
  formValues: Map<number, ProductFormValues>,
): Column<ProductPerformanceRow>[] {
  return [
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
    {
      header: "",
      width: 72,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <ProductDialog product={formValues.get(row.id)} />
          <ArchiveProductDialog id={row.id} name={row.name} />
        </div>
      ),
    },
  ];
}

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  await requirePageAccess("sales:read");

  const params = await searchParams;

  const [kpis, products, allPerformance, formValues] = await Promise.all([
    getProductKpis(),
    getProducts(),
    getProductPerformance(),
    getProductFormValues(),
  ]);

  const productPerformance = paginateAll(allPerformance, params);
  const columns = buildColumns(formValues);

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
        <ProductDialog />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Products"
          icon={Box}
          value={count(kpis.active)}
          delta={kpis.outOfStock ? `${kpis.outOfStock} out` : "All stocked"}
          deltaIcon={TrendingUp}
          deltaTone={kpis.outOfStock ? "warning" : "success"}
          note="in the catalogue"
        />
        <KpiCard
          label="Units Sold (30d)"
          icon={ShoppingBag}
          value={count(kpis.units)}
          delta={signedPercent(kpis.unitsChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.unitsChangePct >= 0 ? "success" : "warning"}
          note="vs previous 30 days"
        />
        <KpiCard
          label="Average Margin"
          icon={Percent}
          value={percent(kpis.averageMargin)}
          delta={kpis.averageMargin >= 30 ? "Healthy" : "Thin"}
          deltaIcon={TrendingUp}
          deltaTone={kpis.averageMargin >= 30 ? "success" : "warning"}
          note="revenue less cost"
        />
        <KpiCard
          label="Revenue (30d)"
          icon={Banknote}
          value={kpis.revenueLabel}
          delta={signedPercent(kpis.revenueChangePct)}
          deltaIcon={TrendingUp}
          deltaTone={kpis.revenueChangePct >= 0 ? "success" : "warning"}
          note="vs previous 30 days"
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => {
          const Icon = productIcons[product.icon];
          return (
            <Card key={product.id} className="flex flex-col gap-3.5 p-4">
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
          rows={productPerformance.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter summary={`Showing ${productPerformance.range} products`}>
          <Pager
            page={productPerformance.page}
            hasNext={productPerformance.hasNext}
            hasPrevious={productPerformance.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
