import {
  CalendarCheck,
  CircleCheckBig,
  Minus,
  Phone,
  Plus,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Warehouse,
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
import { GhostButton } from "@/components/ui/ghost-button";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { toneText } from "@/components/ui/tone";
import { employees, type Employee } from "@/lib/data/employees";

const columns: Column<Employee>[] = [
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
];

export default function EmployeesPage() {
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
        <Button icon={Plus}>Add Employee</Button>
      </PageHeader>

      <KpiGrid>
        <KpiCard
          label="Total Employees"
          icon={Users}
          value="12"
          delta="+1"
          deltaIcon={TrendingUp}
          deltaTone="neutral"
          note="3 roles"
        />
        <KpiCard
          label="On Duty Today"
          icon={UserCheck}
          value="9"
          delta="75%"
          deltaIcon={Minus}
          deltaTone="neutral"
          note="3 on leave"
        />
        <KpiCard
          label="Open Tasks"
          icon={CircleCheckBig}
          value="14"
          delta="↓ 3"
          deltaIcon={TrendingDown}
          deltaTone="success"
          note="vs yesterday"
        />
        <KpiCard
          label="Attendance (month)"
          icon={CalendarCheck}
          value="96%"
          delta="+2pp"
          deltaIcon={TrendingUp}
          deltaTone="success"
          note="vs last month"
        />
      </KpiGrid>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {employees.map((employee) => (
          <Card key={employee.name} className="flex flex-col gap-3.5 p-4">
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
          rows={employees}
          rowKey={(row) => row.name}
        />
        <TableFooter summary="Showing 6 of 12 employees">
          <GhostButton>Previous</GhostButton>
          <GhostButton>Next</GhostButton>
        </TableFooter>
      </Card>
    </>
  );
}
