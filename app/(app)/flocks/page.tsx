import Link from "next/link";
import {
  ArrowUpDown,
  Bird,
  CalendarClock,
  Columns3,
  Download,
  HeartPulse,
  Layers,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CellSecondary,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { FilterBar } from "@/components/ui/filter-bar";
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import { flocks, type Flock } from "@/lib/data/flocks";

const columns: Column<Flock>[] = [
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
];

export default function FlocksPage() {
  return (
    <>
      <PageHeader title="Flocks" breadcrumb={["Farm", "Flocks"]}>
        <Button variant="secondary" icon={Download}>
          Export
        </Button>
        <Button icon={Plus}>Add Flock</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Active Flocks"
          icon={Layers}
          value="8"
          delta="+2"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="2 started this month"
        />
        <KpiCard
          label="Total Birds"
          icon={Bird}
          value="24,850"
          delta="+3.2%"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="from last month"
        />
        <KpiCard
          label="Average Age"
          icon={CalendarClock}
          value="19 days"
          delta="—"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="broilers only"
        />
        <KpiCard
          label="Average Mortality"
          icon={HeartPulse}
          value="1.6%"
          delta="↓ 0.3%"
          deltaIcon={TrendingDown}
          deltaTone="success"
          note="from last week"
        />
      </KpiGrid>

      <FilterBar
        placeholder="Search flock ID or breed…"
        selects={["House", "Breed", "Type", "Status", "Age"]}
      />

      <Card className="flex flex-col">
        <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h2 className="text-md font-semibold text-ink">All Flocks</h2>
            <p className="text-sm text-ink-2">
              8 flocks · 6 active, 1 brooding, 1 closed
            </p>
          </div>
          <GhostButton icon={Columns3}>Columns</GhostButton>
          <GhostButton icon={ArrowUpDown}>Sort</GhostButton>
        </div>
        <DataTable columns={columns} rows={flocks} rowKey={(row) => row.id} />
        <TableFooter summary="Showing 8 of 8 flocks">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
