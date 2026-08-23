import {
  CalendarCheck,
  CircleCheckBig,
  Minus,
  Phone,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Warehouse,
} from "lucide-react";

import {
  DeactivateUserDialog,
  EmployeeDialog,
  type UserFormValues,
} from "@/components/dialogs/people-dialogs";
import { PageHeader } from "@/components/layout/page-header";
import { paginateAll, param } from "@/lib/pagination";
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
import { Pager } from "@/components/ui/pager";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import {
  getEmployeeKpis,
  getEmployees,
  type EmployeeRow,
  getUserFormValues,
} from "@/lib/data/employees";
import { count, percent } from "@/lib/format";

function buildColumns(
  formValues: Map<number, UserFormValues>,
): Column<EmployeeRow>[] {
  return [
  {
    header: "EMPLOYEE",
    cell: (row) => <CellStack primary={row.name} secondary={row.joined} />,
  },
  {
    header: "ROLE",
    width: 160,
    cell: (row) => <CellText>{row.role}</CellText>,
  },
  {
    header: "PHONE",
    width: 160,
    cell: (row) => <CellText>{row.phone}</CellText>,
    hideBelow: "lg",
  },
  {
    header: "ASSIGNED",
    width: 180,
    cell: (row) => <CellText>{row.assigned}</CellText>,
    hideBelow: "md",
  },
  {
    header: "TASKS",
    width: 80,
    cell: (row) => <CellText strong>{row.tasks}</CellText>,
  },
  {
    header: "ATTENDANCE",
    width: 120,
    cell: (row) => (
      <span
        className={`text-sm-plus font-semibold ${
          row.attendanceTone ? toneText[row.attendanceTone] : "text-ink"
        }`}
      >
        {row.attendance}
      </span>
    ),
  },
  {
    header: "STATUS",
    width: 120,
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
          <EmployeeDialog person={formValues.get(row.id)} />
          <DeactivateUserDialog id={row.id} name={row.name} />
        </div>
      ),
    },
  ];
}

export default async function EmployeesPage({
  searchParams,
}: PageProps<"/employees">) {
  const params = await searchParams;
  const filters = {
    search: param(params, "q"),
    role: param(params, "role"),
    dutyStatus: param(params, "duty"),
  };

  const [kpis, allEmployees, formValues] = await Promise.all([
    getEmployeeKpis(),
    getEmployees(filters),
    getUserFormValues(),
  ]);

  const employees = paginateAll(allEmployees, params);
  const columns = buildColumns(formValues);

  const onDutyShare = kpis.total
    ? percent((kpis.onDuty / kpis.total) * 100, 0)
    : "—";

  return (
    <>
      <PageHeader
        title="Employees"
        breadcrumb={["People", "Employees"]}
        subtitle="Who works where, and what they are responsible for."
      >
        <Button variant="secondary" icon={CalendarCheck}>
          Attendance
        </Button>
        <EmployeeDialog />
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Employees"
          icon={Users}
          value={count(kpis.total)}
          delta={`${kpis.roles} role${kpis.roles === 1 ? "" : "s"}`}
          deltaIcon={Users}
          deltaTone="neutral"
          note="active accounts"
        />
        <KpiCard
          label="On Duty Today"
          icon={UserCheck}
          value={count(kpis.onDuty)}
          delta={onDutyShare}
          deltaIcon={Minus}
          deltaTone="neutral"
          note={`${kpis.onLeave} on leave`}
        />
        <KpiCard
          label="Open Tasks"
          icon={CircleCheckBig}
          value={count(kpis.openTasks)}
          delta={
            kpis.overdueTasks
              ? `${kpis.overdueTasks} overdue`
              : "None overdue"
          }
          deltaIcon={kpis.overdueTasks ? TrendingUp : TrendingDown}
          deltaTone={kpis.overdueTasks ? "error" : "success"}
          note="across the team"
        />
        <KpiCard
          label="Attendance (month)"
          icon={CalendarCheck}
          value={kpis.attendanceLabel}
          delta="Average"
          deltaIcon={TrendingUp}
          deltaTone={kpis.attendance >= 95 ? "success" : "warning"}
          note="active staff"
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allEmployees.map((employee) => (
          <Card key={employee.id} className="flex flex-col gap-3.5 p-4">
            <div className="flex items-center gap-3">
              <Avatar initials={employee.initials} size={44} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-md font-semibold text-ink">
                  {employee.name}
                </span>
                <span className="truncate text-sm text-ink-2">
                  {employee.role}
                </span>
              </div>
              <Badge tone={employee.statusTone}>{employee.status}</Badge>
            </div>

            <ul className="flex flex-col gap-2.5">
              <li className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-ink-3" />
                <span className="truncate text-sm text-ink-2">
                  {employee.phone}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Warehouse className="size-3.5 shrink-0 text-ink-3" />
                <span className="truncate text-sm text-ink-2">
                  {employee.assigned}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CircleCheckBig className="size-3.5 shrink-0 text-ink-3" />
                <span className="truncate text-sm text-ink-2">
                  {employee.workload}
                </span>
              </li>
            </ul>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col">
        <PanelHead inset title="All Employees" />
        <DataTable
          columns={columns}
          rows={employees.rows}
          rowKey={(row) => String(row.id)}
        />
        <TableFooter
          summary={`Showing ${employees.range} of ${kpis.total} employees`}
        >
          <Pager
            page={employees.page}
            hasNext={employees.hasNext}
            hasPrevious={employees.hasPrevious}
          />
        </TableFooter>
      </Card>
    </>
  );
}
