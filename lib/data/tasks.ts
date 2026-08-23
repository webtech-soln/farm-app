import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import { tasks as table, users } from "@/lib/db/schema";

import { initialsFor, relativeTime, shortName } from "./common";

export type TaskPriority = "High" | "Medium" | "Low";

export type TaskCard = {
  id: number;
  title: string;
  detail: string;
  priority: TaskPriority;
  /** The house, board or area the work belongs to. */
  context: string;
  initials: string;
  assignee: string;
  due: string;
  /** Set when an open task is already past its due time. */
  overdue?: boolean;
};

export type TaskColumn = {
  key: "pending" | "in_progress" | "completed";
  name: string;
  /** Colour of the dot beside the column title. */
  tone: Tone;
  count: string;
  /** Completed cards mute the title and show a check beside the timestamp. */
  done?: boolean;
  tasks: TaskCard[];
};

export const priorityTone: Record<TaskPriority, Tone> = {
  High: "error",
  Medium: "warning",
  Low: "violet",
};

const PRIORITY_LABEL: Record<string, TaskPriority> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const COLUMNS = [
  { key: "pending", name: "Pending", tone: "neutral" },
  { key: "in_progress", name: "In Progress", tone: "info" },
  { key: "completed", name: "Completed", tone: "success", done: true },
] as const;

export type TaskFilters = {
  assigneeId?: number;
  priority?: "high" | "medium" | "low";
};

/**
 * The kanban board. Completed work is capped at the most recent cards — the
 * column is a "what got done" strip, not an archive.
 */
export async function getTaskBoard(
  filters: TaskFilters = {},
): Promise<TaskColumn[]> {
  const conditions = [];
  if (filters.assigneeId) conditions.push(eq(table.assigneeId, filters.assigneeId));
  if (filters.priority) {
    conditions.push(sql`${table.priority}::text = ${filters.priority}`);
  }

  const rows = await db
    .select({
      id: table.id,
      title: table.title,
      detail: table.detail,
      priority: table.priority,
      status: table.status,
      contextLabel: table.contextLabel,
      dueAt: table.dueAt,
      completedAt: table.completedAt,
      assignee: users.name,
    })
    .from(table)
    .leftJoin(users, eq(users.id, table.assigneeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      // Due first, then the hard-priority cards, so the top of a column is
      // what needs attention now.
      sql`${table.dueAt} asc nulls last`,
      asc(table.id),
    );

  const now = Date.now();

  return COLUMNS.map((column) => {
    const columnRows = rows.filter((row) => row.status === column.key);
    const cards = (column.key === "completed" ? columnRows.slice(-12) : columnRows).map(
      (row): TaskCard => ({
        id: row.id,
        title: row.title,
        detail: row.detail ?? "",
        priority: PRIORITY_LABEL[row.priority] ?? "Medium",
        context: row.contextLabel ?? "General",
        initials: row.assignee ? initialsFor(row.assignee) : "—",
        assignee: shortName(row.assignee),
        due: relativeTime(
          column.key === "completed" ? (row.completedAt ?? row.dueAt) : row.dueAt,
        ),
        overdue:
          column.key !== "completed" && row.dueAt
            ? row.dueAt.getTime() < now
            : undefined,
      }),
    );

    return {
      key: column.key,
      name: column.name,
      tone: column.tone as Tone,
      count: String(columnRows.length),
      ...("done" in column ? { done: column.done } : {}),
      tasks: cards,
    };
  });
}

/** The "14 open · 6 completed today" strip above the board. */
export async function getTaskCounts() {
  const [row] = await db
    .select({
      open: sql<number>`count(*) filter (where ${table.status} <> 'completed')::int`,
      overdue: sql<number>`count(*) filter (where ${table.status} <> 'completed' and ${table.dueAt} < now())::int`,
      completedToday: sql<number>`count(*) filter (where ${table.status} = 'completed' and ${table.completedAt}::date = current_date)::int`,
    })
    .from(table);

  return row;
}

export type TaskFormValues = {
  id: number;
  title: string;
  detail: string | null;
  priority: string;
  status: string;
  contextLabel: string | null;
  assigneeId: number | null;
  /** `YYYY-MM-DDTHH:MM` for the datetime input. */
  dueAt: string | null;
};

/** Raw column values keyed by id, so the edit modal can prefill its fields. */
export async function getTaskFormValues(): Promise<Map<number, TaskFormValues>> {
  const rows = await db
    .select({
      id: table.id,
      title: table.title,
      detail: table.detail,
      priority: table.priority,
      status: table.status,
      contextLabel: table.contextLabel,
      assigneeId: table.assigneeId,
      dueAt: table.dueAt,
    })
    .from(table);

  return new Map(
    rows.map((row) => [
      row.id,
      {
        ...row,
        dueAt: row.dueAt ? nowDateTimeLocalFrom(row.dueAt) : null,
      },
    ]),
  );
}

/** `<input type="datetime-local">` reads local wall-clock, not an ISO stamp. */
function nowDateTimeLocalFrom(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
