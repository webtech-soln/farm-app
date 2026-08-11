import {
  Calendar,
  CalendarClock,
  ChevronDown,
  CircleCheckBig,
  Plus,
  Printer,
  ShieldCheck,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarMonth } from "@/components/ui/calendar-month";
import { Card, PanelHead } from "@/components/ui/card";
import {
  CellStack,
  CellText,
  DataTable,
  TableFooter,
  type Column,
} from "@/components/ui/data-table";
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  vaccinationCalendar,
  vaccinations,
  type Vaccination,
} from "@/lib/data/vaccinations";

const columns: Column<Vaccination>[] = [
  {
    header: "VACCINE",
    cell: (row) => <CellStack primary={row.vaccine} secondary={row.route} />,
  },
  {
    header: "FLOCK",
    width: 130,
    cell: (row) => <CellText strong>{row.flock}</CellText>,
  },
  {
    header: "HOUSE",
    width: 90,
    cell: (row) => <CellText>{row.house}</CellText>,
    hideBelow: "md",
  },
  {
    header: "SCHEDULED",
    width: 130,
    cell: (row) => (
      <CellStack primary={row.scheduled} secondary={row.scheduleNote} />
    ),
  },
  {
    header: "ADMINISTERED BY",
    width: 170,
    cell: (row) => <CellText>{row.administeredBy}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "DOSES",
    width: 80,
    cell: (row) => <CellText strong>{row.doses}</CellText>,
  },
  {
    header: "STATUS",
    width: 130,
    cell: (row) => <Badge tone={row.statusTone}>{row.status}</Badge>,
  },
];

export default function VaccinationsPage() {
  return (
    <>
      <PageHeader
        title="Vaccination Schedule"
        breadcrumb={["Health", "Vaccinations"]}
        subtitle="Programme coverage across every flock, by calendar and by record."
      >
        <Button variant="secondary" icon={Printer}>
          Print schedule
        </Button>
        <Button icon={Plus}>Schedule Vaccination</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Due This Week"
          icon={CalendarClock}
          iconTone="warning"
          value="2"
          delta="Soon"
          deltaIcon={TriangleAlert}
          deltaTone="warning"
          note="1 tomorrow"
        />
        <KpiCard
          label="Completed (month)"
          icon={CircleCheckBig}
          value="14"
          delta="+3"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="100% on schedule"
        />
        <KpiCard
          label="Overdue"
          icon={TriangleAlert}
          iconTone="error"
          value="1"
          delta="Urgent"
          deltaIcon={TriangleAlert}
          deltaTone="error"
          note="JF-2026-007"
        />
        <KpiCard
          label="Coverage"
          icon={ShieldCheck}
          value="96.4%"
          delta="+1.2pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="of scheduled doses"
        />
      </KpiGrid>

      <Card className="flex flex-col gap-4 p-4">
        <PanelHead title="August 2026">
          <GhostButton icon={ChevronDown}>Month</GhostButton>
          <GhostButton icon={Calendar}>Today</GhostButton>
        </PanelHead>
        <CalendarMonth days={vaccinationCalendar} />
      </Card>

      <Card className="flex flex-col">
        <PanelHead inset title="Vaccination Records" />
        <DataTable
          columns={columns}
          rows={vaccinations}
          rowKey={(row) => row.vaccine + row.flock}
        />
        <TableFooter summary="Showing 6 of 48 records">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
