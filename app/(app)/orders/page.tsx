import {
  Banknote,
  CircleCheckBig,
  PackageCheck,
  Receipt,
  Truck,
  type LucideIcon,
} from "lucide-react";

import {
  OrderDialog,
  OrderStatusDialog,
  PaymentDialog,
} from "@/components/dialogs/sales-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { getCustomerOptions } from "@/lib/data/customers";
import { getProductOptions } from "@/lib/data/products";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pager } from "@/components/ui/pager";
import { SegmentedControl } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import type { Tone } from "@/components/ui/tone";
import {
  getOrderDetail,
  getOrderStatusCounts,
  getOrders,
  type OrderEventIcon,
  type OrderRow,
} from "@/lib/data/orders";

const eventStyles: Record<OrderEventIcon, { icon: LucideIcon; tone: Tone }> = {
  delivered: { icon: CircleCheckBig, tone: "success" },
  transit: { icon: Truck, tone: "info" },
  packed: { icon: PackageCheck, tone: "violet" },
  payment: { icon: Banknote, tone: "success" },
  placed: { icon: Receipt, tone: "violet" },
};

function buildColumns(): Column<OrderRow>[] {
  return [
    {
      header: "ORDER #",
      width: 130,
      cell: (row) => (
        <CellStack primary={row.reference} secondary={row.placedAt} />
      ),
    },
    {
      header: "CUSTOMER",
      cell: (row) => <CellText>{row.customer}</CellText>,
    },
    {
      header: "ITEMS",
      width: 56,
      cell: (row) => <CellText strong>{row.items}</CellText>,
    },
    {
      header: "TOTAL",
      width: 84,
      cell: (row) => <CellText strong>{row.total}</CellText>,
    },
    {
      header: "PAYMENT",
      width: 92,
      cell: (row) => (
        <Badge tone={row.paymentTone} dot={row.paymentDot ?? true}>
          {row.payment}
        </Badge>
      ),
    },
    {
      header: "DELIVERY",
      width: 88,
      cell: (row) => <CellText>{row.delivery}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 104,
      cell: (row) => (
        <Badge tone={row.statusTone} dot={row.statusDot ?? true}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "",
      width: 72,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <OrderStatusDialog
            id={row.id}
            reference={row.reference}
            status={row.statusKey}
          />
          <PaymentDialog
            orderId={row.id}
            reference={row.reference}
            variant="icon"
          />
        </div>
      ),
    },
  ];
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const params = await searchParams;
  const window = pageWindow(params);
  const filters = {
    search: param(params, "q"),
    status: param(params, "status"),
    paymentStatus: param(params, "payment"),
    customer: param(params, "customer"),
  };

  const [statusCounts, rows, orderDetail, customers, products] =
    await Promise.all([
    getOrderStatusCounts(),
    getOrders(filters, window.limit, window.offset),
    getOrderDetail(),
    getCustomerOptions(),
    getProductOptions(),
  ]);

  const orders = paginate(rows, window);
  const columns = buildColumns();

  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumb={["Sales", "Orders"]}
        subtitle="Every order from placement to delivery."
      >
        <ExportButton board="orders" />
        <OrderDialog customers={customers} products={products} />
      </PageHeader>

      <SegmentedControl
        options={Object.keys(statusCounts)}
        counts={statusCounts}
        name="status"
        defaultOption="All"
      />

      <FilterBar
        placeholder="Search order number or customer…"
        filters={[
          {
            name: "payment",
            label: "Payment",
            options: [
              { value: "paid", label: "Paid" },
              { value: "partial", label: "Partial" },
              { value: "unpaid", label: "Unpaid" },
            ],
          },
          {
            name: "customer",
            label: "Customer",
            options: customers.map((customer) => ({
              value: customer.name,
              label: customer.name,
            })),
          },
        ]}
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex min-w-0 flex-1 flex-col">
          <PanelHead inset title="All Orders" />
          <DataTable
            columns={columns}
            rows={orders.rows}
            rowKey={(row) => String(row.id)}
          />
          <TableFooter
            summary={`Showing ${orders.range} of ${statusCounts.All} orders`}
          >
            <Pager
              page={orders.page}
              hasNext={orders.hasNext}
              hasPrevious={orders.hasPrevious}
            />
          </TableFooter>
        </Card>

        {orderDetail ? (
        <Card className="flex flex-col gap-4 p-4 xl:w-[380px]">
          <PanelHead
            title={orderDetail.reference}
            subtitle={orderDetail.placed}
          />

          <div className="flex items-center gap-2.5 border-y border-border-soft py-3">
            <Avatar initials={orderDetail.customer.initials} size={34} />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-base font-semibold text-ink">
                {orderDetail.customer.name}
              </span>
              <span className="truncate text-xs-plus text-ink-3">
                {orderDetail.customer.meta}
              </span>
            </div>
          </div>

          <ul className="flex flex-col gap-4">
            {orderDetail.lines.map((line) => (
              <li key={line.id} className="flex items-start gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm-plus font-medium text-ink">
                    {line.name}
                  </span>
                  <span className="truncate text-xs text-ink-3">
                    {line.detail}
                  </span>
                </div>
                <span className="text-sm-plus font-semibold text-ink">
                  {line.amount}
                </span>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-2.5">
            {orderDetail.totals.map((line) => (
              <div
                key={line.label}
                className={`flex items-center gap-3 ${
                  line.strong ? "border-t border-border-soft pt-2.5" : ""
                }`}
              >
                <dt
                  className={`flex-1 text-sm-plus ${
                    line.strong ? "font-semibold text-ink" : "text-ink-2"
                  }`}
                >
                  {line.label}
                </dt>
                <dd
                  className={
                    line.strong
                      ? "text-lg font-semibold text-violet-deep"
                      : "text-sm-plus font-semibold text-ink"
                  }
                >
                  {line.value}
                </dd>
              </div>
            ))}
          </dl>

          <h3 className="text-sm-plus font-semibold text-ink">
            Order timeline
          </h3>
          <Timeline
            events={orderDetail.timeline.map((event) => ({
              ...eventStyles[event.icon],
              title: event.title,
              time: event.time,
              description: event.description,
            }))}
          />
        </Card>
        ) : null}
      </div>
    </>
  );
}
