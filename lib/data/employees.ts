import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { tasks, users as table } from "@/lib/db/schema";

import { ROLE_LABELS } from "@/lib/auth/permissions";

import { display, DUTY_STATUS, initialsFor, percent } from "./common";

export type EmployeeRow = {
  id: number;
  initials: string;
  name: string;
  role: string;
  joined: string;
  phone: string;
  assigned: string;
  /** Workload line on the card; the table shows the count only. */
  workload: string;
  tasks: string;
  attendance: string;
  /** Tints the attendance figure when notably high or low. */
  attendanceTone?: Tone;
  status: string;
  statusTone: Tone;
  statusDot?: boolean;
};

export type EmployeeFilters = {
  search?: string;
  role?: string;
  dutyStatus?: string;
};

export async function getEmployees(
  filters: EmployeeFilters = {},
): Promise<EmployeeRow[]> {
  const conditions = [eq(table.isActive, true)];

  if (filters.role) conditions.push(sql`${table.role}::text = ${filters.role}`);
  if (filters.dutyStatus) {
    conditions.push(sql`${table.dutyStatus}::text = ${filters.dutyStatus}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${table.name}) like ${term} or lower(coalesce(${table.jobTitle}, '')) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      role: table.role,
      jobTitle: table.jobTitle,
      phone: table.phone,
      assignedArea: table.assignedArea,
      attendancePct: table.attendancePct,
      dutyStatus: table.dutyStatus,
      joinedOn: table.joinedOn,
      isContractor: table.isContractor,
      openTasks: sql<number>`(
        select count(*)::int from tasks
        where tasks.assignee_id = users.id and tasks.status <> 'completed'
      )`,
    })
    .from(table)
    .where(and(...conditions))
    .orderBy(table.name);

  return rows.map((row) => {
    const statusDisplay = display(DUTY_STATUS, row.dutyStatus);
    const attendance = row.attendancePct;

    return {
      id: row.id,
      initials: initialsFor(row.name),
      name: row.name,
      role: row.jobTitle ?? ROLE_LABELS[row.role] ?? row.role,
      // A contract vet has no start date on the payroll to show.
      joined: row.isContractor
        ? "Contract staff"
        : row.joinedOn
          ? `Joined ${new Date(`${row.joinedOn}T00:00:00`).toLocaleDateString(
              "en-US",
              { month: "short", year: "numeric" },
            )}`
          : "—",
      phone: row.phone ?? "—",
      assigned: row.assignedArea ?? "—",
      workload: `${row.openTasks} open task${row.openTasks === 1 ? "" : "s"}`,
      tasks: String(row.openTasks),
      attendance: attendance === null ? "—" : percent(attendance, 0),
      attendanceTone:
        attendance === null
          ? "neutral"
          : attendance >= 96
            ? "success"
            : attendance < 90
              ? "warning"
              : undefined,
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusDot:
        row.dutyStatus === "on_leave" || row.dutyStatus === "off_duty"
          ? false
          : undefined,
    };
  });
}

export async function getEmployeeKpis() {
  const [[staff], [work]] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        onDuty: sql<number>`count(*) filter (where ${table.dutyStatus} in ('on_duty','visiting','on_road'))::int`,
        onLeave: sql<number>`count(*) filter (where ${table.dutyStatus} = 'on_leave')::int`,
        roles: sql<number>`count(distinct ${table.role})::int`,
        attendance: sql<number>`coalesce(avg(${table.attendancePct}), 0)::double precision`,
      })
      .from(table)
      .where(eq(table.isActive, true)),
    db
      .select({
        open: sql<number>`count(*) filter (where ${tasks.status} <> 'completed')::int`,
        overdue: sql<number>`count(*) filter (where ${tasks.status} <> 'completed' and ${tasks.dueAt} < now())::int`,
      })
      .from(tasks),
  ]);

  return {
    total: staff.total,
    onDuty: staff.onDuty,
    onLeave: staff.onLeave,
    roles: staff.roles,
    attendance: staff.attendance,
    attendanceLabel: percent(staff.attendance, 0),
    openTasks: work.open,
    overdueTasks: work.overdue,
  };
}

/** Assignee picker options for the task form. */
export async function getAssigneeOptions() {
  return db
    .select({
      id: table.id,
      name: table.name,
      role: table.role,
      dutyStatus: table.dutyStatus,
    })
    .from(table)
    .where(eq(table.isActive, true))
    .orderBy(table.name);
}

export { ROLE_LABELS };

export type UserFormValues = {
  id: number;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  phone: string | null;
  assignedArea: string | null;
  dutyStatus: string;
  joinedOn: string | null;
  attendancePct: number | null;
  isContractor: boolean;
  isActive: boolean;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getUserFormValues(): Promise<Map<number, UserFormValues>> {
  const rows = await db
    .select({
      id: table.id,
      name: table.name,
      email: table.email,
      role: table.role,
      jobTitle: table.jobTitle,
      phone: table.phone,
      assignedArea: table.assignedArea,
      dutyStatus: table.dutyStatus,
      joinedOn: table.joinedOn,
      attendancePct: table.attendancePct,
      isContractor: table.isContractor,
      isActive: table.isActive,
    })
    .from(table);

  return new Map(rows.map((row) => [row.id, row]));
}
