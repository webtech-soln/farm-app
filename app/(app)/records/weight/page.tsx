import { Scale, Target, TrendingUp, Users } from "lucide-react";

import {
  DeleteWeightDialog,
  WeightFormDialog,
} from "@/components/dialogs/record-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CellSecondary,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { getFlockOptions, getWeightRecords } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { requirePageAccess } from "@/lib/auth/route-access";

type WeightRow = Awaited<ReturnType<typeof getWeightRecords>>[number];

const columns: Column<WeightRow>[] = [
  {
    header: "DATE",
    width: 116,
    cell: (row) => <CellText>{row.date}</CellText>,
  },
  {
    header: "FLOCK",
    width: 130,
    cell: (row) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <CellText strong>{row.flock}</CellText>
        <CellSecondary>{row.house}</CellSecondary>
      </div>
    ),
  },
  { header: "AGE", width: 84, cell: (row) => <CellText>{row.age}</CellText> },
  {
    header: "AVG WEIGHT",
    width: 104,
    align: "right",
    cell: (row) => <CellText strong>{row.weight}</CellText>,
  },
  {
    header: "STANDARD",
    width: 100,
    align: "right",
    cell: (row) => <CellText>{row.standard}</CellText>,
    hideBelow: "md",
  },
  {
    header: "VARIANCE",
    width: 96,
    align: "right",
    cell: (row) => <Badge tone={row.varianceTone}>{row.variance}</Badge>,
  },
  {
    header: "SAMPLE",
    width: 84,
    align: "right",
    cell: (row) => <CellText>{row.sample}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "UNIFORMITY",
    width: 100,
    align: "right",
    cell: (row) => <CellText>{row.uniformity}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "",
    width: 48,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        <DeleteWeightDialog id={row.id} />
      </div>
    ),
  },
];

export default async function WeightPage() {
  await requirePageAccess("records:read");

  const [records, flocks, houses] = await Promise.all([
    getWeightRecords(),
    getFlockOptions({ activeOnly: true }),
    getHouseOptions(),
  ]);

  const numeric = records.map((row) => Number.parseFloat(row.weight));
  const latest = records[0];
  const flocksSampled = new Set(records.map((row) => row.flock)).size;
  const aboveStandard = records.filter((row) =>
    row.variance.startsWith("+"),
  ).length;
  const average =
    numeric.length > 0
      ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length
      : 0;

  return (
    <>
      <PageHeader
        title="Weight Sampling"
        breadcrumb={["Operations", "Weight"]}
        subtitle="Sampled averages against the breed standard, newest first."
      >
        <WeightFormDialog flocks={flocks} houses={houses} />
      </PageHeader>

      {records.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No weight samples yet"
          description="Sample at least 30 birds per flock to build a growth curve against the breed standard."
        >
          <WeightFormDialog flocks={flocks} houses={houses} />
          <ButtonLink href="/flocks" variant="secondary">
            View flocks
          </ButtonLink>
        </EmptyState>
      ) : (
        <>
          <KpiGrid>
            <KpiCard
              label="Latest Sample"
              icon={Scale}
              value={latest.weight}
              delta={latest.variance}
              deltaIcon={TrendingUp}
              deltaTone={latest.varianceTone === "success" ? "success" : "warning"}
              note={`${latest.flock} · ${latest.date}`}
            />
            <KpiCard
              label="Average Weight"
              icon={Target}
              value={`${average.toFixed(2)} kg`}
              delta={`${records.length} samples`}
              deltaIcon={Scale}
              deltaTone="neutral"
              note="across recent samples"
            />
            <KpiCard
              label="Flocks Sampled"
              icon={Users}
              value={String(flocksSampled)}
              delta={`${flocks.length} active`}
              deltaIcon={Users}
              deltaTone="neutral"
              note="with a recorded sample"
            />
            <KpiCard
              label="At or Above Standard"
              icon={TrendingUp}
              value={`${aboveStandard}/${records.length}`}
              delta={
                records.length > 0
                  ? `${Math.round((aboveStandard / records.length) * 100)}%`
                  : "—"
              }
              deltaIcon={TrendingUp}
              deltaTone={
                aboveStandard * 2 >= records.length ? "success" : "warning"
              }
              note="of recent samples"
            />
          </KpiGrid>

          <Card className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-3.5">
              <div className="flex min-w-0 flex-[1_1_12rem] flex-col gap-[3px]">
                <h2 className="text-md font-semibold text-ink">
                  Weight samples
                </h2>
                <p className="text-sm text-ink-2">
                  {records.length} samples across {flocksSampled} flocks
                </p>
              </div>
            </div>
            <DataTable
              columns={columns}
              rows={records}
              rowKey={(row) => String(row.id)}
            />
            <TableFooter summary={`Showing ${records.length} samples`} />
          </Card>
        </>
      )}
    </>
  );
}
