import Link from "next/link";
import {
  Bird,
  CalendarClock,
  HeartPulse,
  Layers,
  Minus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ExportButton } from "@/components/ui/export-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CellSecondary,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import {
  CloseFlockDialog,
  DeleteFlockDialog,
  FlockFormDialog,
} from "@/components/dialogs/flock-dialogs";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pager } from "@/components/ui/pager";
import { RangeSelect } from "@/components/ui/range-select";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  getFlockFilterOptions,
  getFlockFormValues,
  getFlockKpis,
  getFlocks,
  type Flock,
  type FlockFormValues,
} from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { count, percent } from "@/lib/format";
import { PAGE_SIZE, paginateAll, param } from "@/lib/pagination";
import { requirePageAccess } from "@/lib/auth/route-access";

function buildColumns(
  houses: { id: number; code: string; name: string }[],
  formValues: Map<number, FlockFormValues>,
): Column<Flock>[] {
  return [
    {
      header: "FLOCK ID",
      cell: (row) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={`/flocks/${row.id}`}
            className="truncate text-sm-plus font-semibold text-ink hover:text-violet-deep"
          >
            {row.id}
          </Link>
          <CellSecondary>{row.started}</CellSecondary>
        </div>
      ),
    },
    { header: "TYPE", width: 72, cell: (row) => <CellText>{row.type}</CellText> },
    {
      header: "BREED",
      width: 88,
      cell: (row) => <CellText>{row.breed}</CellText>,
    },
    {
      header: "HOUSE",
      width: 78,
      cell: (row) => <CellText>{row.house}</CellText>,
      hideBelow: "md",
    },
    {
      header: "INITIAL",
      width: 70,
      align: "right",
      cell: (row) => <CellText>{row.initial}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "CURRENT",
      width: 76,
      align: "right",
      cell: (row) => <CellText strong>{row.current}</CellText>,
    },
    {
      header: "AGE",
      width: 76,
      cell: (row) => <CellText>{row.age}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "MORTALITY",
      width: 86,
      align: "right",
      cell: (row) => (
        <span
          className={`text-sm-plus font-semibold ${
            row.mortalityTone === "ink" ? "text-ink" : toneText[row.mortalityTone]
          }`}
        >
          {row.mortality}
        </span>
      ),
    },
    {
      header: "AVG WEIGHT",
      width: 92,
      align: "right",
      cell: (row) => <CellText strong>{row.weight}</CellText>,
      hideBelow: "lg",
    },
    {
      header: "STATUS",
      width: 104,
      cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
    },
    {
      header: "",
      width: 96,
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <FlockFormDialog houses={houses} flock={formValues.get(row.dbId)} />
          {row.status === "Closed" ? null : (
            <CloseFlockDialog id={row.dbId} code={row.id} />
          )}
          <DeleteFlockDialog id={row.dbId} code={row.id} />
        </div>
      ),
    },
  ];
}

export default async function FlocksPage({
  searchParams,
}: PageProps<"/flocks">) {
  await requirePageAccess("farm:read");

  const params = await searchParams;
  const filters = {
    search: param(params, "q"),
    house: param(params, "house"),
    breed: param(params, "breed"),
    type: param(params, "type"),
    status: param(params, "status"),
    sort: param(params, "sort"),
  };

  const [allFlocks, kpis, houses, formValues, filterOptions] = await Promise.all([
    getFlocks(filters),
    getFlockKpis(),
    getHouseOptions(),
    getFlockFormValues(),
    getFlockFilterOptions(),
  ]);

  const flocks = paginateAll(allFlocks, params, PAGE_SIZE);

  const columns = buildColumns(houses, formValues);

  const breakdown = [
    `${kpis.counts.active} active`,
    kpis.counts.brooding ? `${kpis.counts.brooding} brooding` : null,
    kpis.counts.closed ? `${kpis.counts.closed} closed` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader title="Flocks" breadcrumb={["Farm", "Flocks"]}>
        <ExportButton board="flocks" />
        <FlockFormDialog houses={houses} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Flocks"
          icon={Layers}
          value={count(kpis.activeFlocks)}
          delta={
            kpis.startedThisMonth ? `+${kpis.startedThisMonth}` : "—"
          }
          deltaIcon={kpis.startedThisMonth ? TrendingUp : Minus}
          deltaTone={kpis.startedThisMonth ? "success" : "neutral"}
          note={`${kpis.startedThisMonth} started this month`}
        />
        <KpiCard
          label="Total Birds"
          icon={Bird}
          value={count(kpis.totalBirds)}
          delta={`${kpis.housesInUse} houses`}
          deltaIcon={Layers}
          deltaTone="neutral"
          note="live birds on farm"
        />
        <KpiCard
          label="Average Age"
          icon={CalendarClock}
          value={`${kpis.averageAgeDays} days`}
          delta="—"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="broilers only"
        />
        <KpiCard
          label="Average Mortality"
          icon={HeartPulse}
          value={percent(kpis.mortalityPct)}
          delta={kpis.mortalityPct >= 3 ? "Watch" : "Normal"}
          deltaIcon={kpis.mortalityPct >= 3 ? TrendingUp : TrendingDown}
          deltaTone={kpis.mortalityPct >= 3 ? "warning" : "success"}
          note="placement to date"
        />
      </KpiGrid>

      <FilterBar
        placeholder="Search flock ID or breed…"
        filters={[
          { name: "house", label: "House", options: filterOptions.houses },
          { name: "breed", label: "Breed", options: filterOptions.breeds },
          { name: "type", label: "Type", options: filterOptions.types },
          { name: "status", label: "Status", options: filterOptions.statuses },
        ]}
      />

      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h2 className="text-md font-semibold text-ink">All Flocks</h2>
            <p className="text-sm text-ink-2">
              {kpis.counts.total} flocks · {breakdown}
            </p>
          </div>
          <RangeSelect
            name="sort"
            defaultValue="code"
            options={[
              { value: "code", label: "Sort · Flock ID" },
              { value: "newest", label: "Sort · Newest placement" },
              { value: "oldest", label: "Sort · Oldest placement" },
              { value: "birds", label: "Sort · Most birds" },
            ]}
          />
        </div>
        <DataTable
          columns={columns}
          rows={flocks.rows}
          rowKey={(row) => row.id}
        />
        <TableFooter
          summary={`Showing ${flocks.range} of ${allFlocks.length} flocks`}
        >
          <Pager
            page={flocks.page}
            hasNext={flocks.hasNext}
            hasPrevious={flocks.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
