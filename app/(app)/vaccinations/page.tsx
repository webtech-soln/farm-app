import {
  CalendarClock,
  CircleCheckBig,
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
import { MonthNav } from "@/components/ui/month-nav";
import { Pager } from "@/components/ui/pager";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import {
  getVaccinationCalendar,
  getVaccinationKpis,
  getVaccinations,
  type VaccinationRow,
} from "@/lib/data/vaccinations";
import {
  CancelVaccinationDialog,
  CompleteVaccinationDialog,
  VaccinationDialog,
} from "@/components/dialogs/health-dialogs";
import { getAssigneeOptions } from "@/lib/data/employees";
import { getFlockOptions } from "@/lib/data/flocks";
import { getHouseOptions } from "@/lib/data/houses";
import { pageWindow, paginate, param } from "@/lib/pagination";
import { count } from "@/lib/format";

const columns: Column<VaccinationRow>[] = [
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
  {
    header: "",
    width: 72,
    align: "right",
    cell: (row) => (
      <div className="flex items-center justify-end">
        {row.statusKey === "completed" || row.statusKey === "cancelled" ? null : (
          <>
            <CompleteVaccinationDialog
              id={row.id}
              vaccine={row.vaccine}
              doses={row.doseCount}
            />
            <CancelVaccinationDialog id={row.id} vaccine={row.vaccine} />
          </>
        )}
      </div>
    ),
  },
];

export default async function VaccinationsPage({
  searchParams,
}: PageProps<"/vaccinations">) {
  const params = await searchParams;
  const window = pageWindow(params);
  // `?month=YYYY-MM` moves the calendar; without it — or with anything that is
  // not a real month — the current month shows. An unchecked value here reaches
  // the calendar as an Invalid Date and takes the whole board down with it.
  const monthParam = /^\d{4}-(0[1-9]|1[0-2])$/.test(param(params, "month") ?? "")
    ? param(params, "month")!
    : undefined;
  const reference = monthParam
    ? new Date(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1)
    : new Date();
  const month = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, "0")}`;
  const filters = {
    search: param(params, "q"),
    flock: param(params, "flock"),
    house: param(params, "house"),
    status: param(params, "status"),
  };

  const [kpis, calendar, rows, flocks, houses, people] =
    await Promise.all([
      getVaccinationKpis(),
      getVaccinationCalendar(reference),
      getVaccinations(filters, window.limit, window.offset),
      getFlockOptions({ activeOnly: true }),
      getHouseOptions(),
      getAssigneeOptions(),
    ]);

  const vaccinations = paginate(rows, window);

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
        <VaccinationDialog flocks={flocks} houses={houses} people={people} />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Due This Week"
          icon={CalendarClock}
          iconTone={kpis.upcoming ? "warning" : undefined}
          value={count(kpis.upcoming)}
          delta={kpis.upcoming ? "Soon" : "Clear"}
          deltaIcon={kpis.upcoming ? TriangleAlert : CircleCheckBig}
          deltaTone={kpis.upcoming ? "warning" : "success"}
          note={`${kpis.tomorrow} tomorrow`}
        />
        <KpiCard
          label="Completed (month)"
          icon={CircleCheckBig}
          value={count(kpis.completedThisMonth)}
          delta={
            kpis.completedChange >= 0
              ? `+${kpis.completedChange}`
              : String(kpis.completedChange)
          }
          deltaIcon={TrendingUp}
          deltaTone={kpis.completedChange >= 0 ? "success" : "warning"}
          note="vs last month"
        />
        <KpiCard
          label="Overdue"
          icon={TriangleAlert}
          iconTone={kpis.overdue ? "error" : undefined}
          value={count(kpis.overdue)}
          delta={kpis.overdue ? "Urgent" : "None"}
          deltaIcon={kpis.overdue ? TriangleAlert : CircleCheckBig}
          deltaTone={kpis.overdue ? "error" : "success"}
          note={kpis.overdueFlock ?? "all flocks on schedule"}
        />
        <KpiCard
          label="Coverage"
          icon={ShieldCheck}
          value={kpis.coverageLabel}
          delta={kpis.coverage >= 95 ? "On target" : "Below target"}
          deltaIcon={TrendingUp}
          deltaTone={kpis.coverage >= 95 ? "success" : "warning"}
          note="of doses due"
        />
      </KpiGrid>

      <Card className="flex flex-col gap-4 p-4">
        <PanelHead title={calendar.label}>
          <MonthNav month={month} />
        </PanelHead>
        <CalendarMonth days={calendar.days} />
      </Card>

      <Card className="flex flex-col">
        <PanelHead inset title="Vaccination Records" />
        <DataTable
          columns={columns}
          rows={vaccinations.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter
          summary={`Showing ${vaccinations.range} of ${kpis.total} records`}
        >
          <Pager
            page={vaccinations.page}
            hasNext={vaccinations.hasNext}
            hasPrevious={vaccinations.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
