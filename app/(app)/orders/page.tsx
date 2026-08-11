import {
  Banknote,
  CircleCheckBig,
  Download,
  PackageCheck,
  Plus,
  Receipt,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
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
import { SegmentedControl } from "@/components/ui/tabs";
import { Timeline } from "@/components/ui/timeline";
import type { Tone } from "@/components/ui/tone";
import {
  orderDetail,
  orderStatusCounts,
  orderTimeline,
  orders,
  type Order,
  type OrderEvent,
} from "@/lib/data/orders";

const eventStyles: Record<
  OrderEvent["icon"],
  { icon: LucideIcon; tone: Tone }
> = {
  delivered: { icon: CircleCheckBig, tone: "success" },
  transit: { icon: Truck, tone: "info" },
  packed: { icon: PackageCheck, tone: "violet" },
  payment: { icon: Banknote, tone: "success" },
  placed: { icon: Receipt, tone: "violet" },
};

const columns: Column<Order>[] = [
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
];

export default function OrdersPage() {
  return (
    <>
      <PageHeader
        title="Orders"
        breadcrumb={["Sales", "Orders"]}
        subtitle="Every order from placement to delivery."
      >
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Create Order</Button>
      </PageHeader>

      <SegmentedControl
        options={Object.keys(orderStatusCounts)}
        counts={orderStatusCounts}
      />

      <FilterBar
        placeholder="Search order number or customer…"
        selects={["Payment", "Delivery", "Date range"]}
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex min-w-0 flex-1 flex-col">
          <PanelHead inset title="All Orders" />
          <DataTable
            columns={columns}
            rows={orders}
            rowKey={(row) => row.reference}
          />
          <TableFooter summary="Showing 7 of 162 orders">
            <GhostButton>Previous</GhostButton>
            <GhostButton>Next</GhostButton>
          </TableFooter>
        </Card>

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
              <li key={line.name} className="flex items-start gap-3">
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
            events={orderTimeline.map((event) => ({
              ...eventStyles[event.icon],
              title: event.title,
              time: event.time,
              description: event.description,
            }))}
          />
        </Card>
      </div>
    </>
  );
}
