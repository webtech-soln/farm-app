import "server-only";

import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  flocks,
  healthEvents as healthEventsTable,
  houses,
  inventoryItems,
  users,
  vaccinations,
} from "@/lib/db/schema";

import {
  axis,
  count,
  daysBetween,
  display,
  DONUT_COLORS,
  formatDate,
  HEALTH_STATUS,
  shortName,
} from "./common";
import { getFarmSettings } from "./settings";
import { isoDaysAgo } from "@/lib/date";

const isoDay = isoDaysAgo;

/** An event counts as open until it is resolved. */
const OPEN_STATUSES = sql`${healthEventsTable.status} in ('escalated','in_treatment','monitoring')`;

/**
 * Cases opened per week, split into the ones that have since been resolved
 * and the ones still open, which is how the stacked bars read.
 */
export async function getHealthEventsTrend(weeks = 8) {
  const rows = await db
    .select({
      week: sql<string>`to_char(date_trunc('week', ${healthEventsTable.occurredOn}), 'YYYY-MM-DD')`,
      resolved: sql<number>`count(*) filter (where ${healthEventsTable.status} = 'resolved')::int`,
      open: sql<number>`count(*) filter (where ${healthEventsTable.status} <> 'resolved')::int`,
    })
    .from(healthEventsTable)
    .where(
      sql`${healthEventsTable.occurredOn} >= date_trunc('week', current_date) - make_interval(weeks => ${weeks - 1})`,
    )
    .groupBy(sql`date_trunc('week', ${healthEventsTable.occurredOn})`)
    .orderBy(sql`date_trunc('week', ${healthEventsTable.occurredOn})`);

  const resolved = rows.map((row) => row.resolved);
  const open = rows.map((row) => row.open);
  const { max, ticks } = axis(
    Math.max(...rows.map((row) => row.resolved + row.open), 1),
  );

  return {
    labels: rows.map((_, index) => `W${index + 1}`),
    ticks,
    max,
    resolved,
    open,
  };
}

export async function getCasesByCondition(days = 90) {
  const rows = await db
    .select({
      condition: healthEventsTable.condition,
      total: sql<number>`sum(${healthEventsTable.cases})::int`,
    })
    .from(healthEventsTable)
    .where(gte(healthEventsTable.occurredOn, isoDay(days)))
    .groupBy(healthEventsTable.condition)
    .orderBy(desc(sql`sum(${healthEventsTable.cases})`))
    .limit(6);

  return rows.map((row, index) => ({
    name: row.condition,
    value: row.total,
    color: DONUT_COLORS[index] ?? DONUT_COLORS.at(-1)!,
    display: count(row.total),
  }));
}

export type HealthAlert = {
  icon: "alert" | "vet" | "vaccine";
  tone: Tone;
  title: string;
  location: string;
  description: string;
  action: string;
};

/**
 * The "Attention Required" panel: unresolved events first, then vaccinations
 * that are overdue or land within the week.
 */
export async function getHealthAlerts(limit = 6): Promise<HealthAlert[]> {
  const [events, shots] = await Promise.all([
    db
      .select({
        condition: healthEventsTable.condition,
        cases: healthEventsTable.cases,
        treatment: healthEventsTable.treatment,
        status: healthEventsTable.status,
        occurredOn: healthEventsTable.occurredOn,
        flockCode: flocks.code,
        houseName: houses.name,
      })
      .from(healthEventsTable)
      .innerJoin(flocks, eq(flocks.id, healthEventsTable.flockId))
      .leftJoin(houses, eq(houses.id, healthEventsTable.houseId))
      .where(OPEN_STATUSES)
      .orderBy(
        sql`case ${healthEventsTable.status} when 'escalated' then 0 when 'in_treatment' then 1 else 2 end`,
        desc(healthEventsTable.occurredOn),
      )
      .limit(limit),
    db
      .select({
        vaccine: vaccinations.vaccine,
        route: vaccinations.route,
        scheduledOn: vaccinations.scheduledOn,
        scheduledAt: vaccinations.scheduledAt,
        status: vaccinations.status,
        flockCode: flocks.code,
        houseName: houses.name,
      })
      .from(vaccinations)
      .leftJoin(flocks, eq(flocks.id, vaccinations.flockId))
      .leftJoin(houses, eq(houses.id, vaccinations.houseId))
      .where(
        and(
          sql`${vaccinations.status} in ('scheduled','overdue')`,
          sql`${vaccinations.scheduledOn} <= current_date + 7`,
        ),
      )
      .orderBy(vaccinations.scheduledOn)
      .limit(limit),
  ]);

  const eventAlerts = events.map((row): HealthAlert => {
    const escalated = row.status === "escalated";
    return {
      icon: escalated ? "alert" : "vet",
      tone: escalated ? "error" : row.status === "in_treatment" ? "warning" : "info",
      title: row.condition,
      location: `Flock ${row.flockCode}${row.houseName ? ` · ${row.houseName}` : ""}`,
      description: `${count(row.cases)} birds affected. ${
        row.treatment ?? "Vet review requested."
      }`,
      action: escalated ? "Assign vet" : "View plan",
    };
  });

  const shotAlerts = shots.map((row): HealthAlert => {
    const dueIn = daysBetween(new Date(), row.scheduledOn);
    const when =
      row.status === "overdue" || dueIn < 0
        ? `Overdue by ${Math.abs(dueIn)} day${Math.abs(dueIn) === 1 ? "" : "s"}`
        : dueIn === 0
          ? "Due today"
          : dueIn === 1
            ? "Scheduled for tomorrow"
            : `Due in ${dueIn} days`;

    return {
      icon: "vaccine",
      tone: row.status === "overdue" || dueIn < 0 ? "error" : "info",
      title: `${row.vaccine} due`,
      location: `Flock ${row.flockCode ?? "All flocks"}${
        row.houseName ? ` · ${row.houseName}` : ""
      }`,
      description: `${when}${row.scheduledAt ? ` at ${row.scheduledAt.slice(0, 5)}` : ""} · ${row.route}.`,
      action: "Confirm",
    };
  });

  return [...eventAlerts, ...shotAlerts].slice(0, limit);
}

export type HealthEventRow = {
  id: number;
  date: string;
  reportedBy: string;
  flock: string;
  house: string;
  condition: string;
  cases: string;
  treatment: string;
  status: string;
  statusTone: Tone;
  /** Raw enum value, for the row actions. */
  statusKey: string;
};

export type HealthFilters = {
  search?: string;
  flock?: string;
  house?: string;
  status?: string;
  days?: number;
};

export async function getHealthEvents(
  filters: HealthFilters = {},
  limit = 50,
  offset = 0,
): Promise<HealthEventRow[]> {
  const conditions = [];

  if (filters.days) {
    conditions.push(gte(healthEventsTable.occurredOn, isoDay(filters.days)));
  }
  if (filters.flock) conditions.push(eq(flocks.code, filters.flock));
  if (filters.house) conditions.push(eq(houses.code, filters.house));
  if (filters.status) {
    conditions.push(sql`${healthEventsTable.status}::text = ${filters.status}`);
  }
  if (filters.search) {
    const term = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${healthEventsTable.condition}) like ${term} or lower(${flocks.code}) like ${term})`,
    );
  }

  const rows = await db
    .select({
      id: healthEventsTable.id,
      occurredOn: healthEventsTable.occurredOn,
      condition: healthEventsTable.condition,
      cases: healthEventsTable.cases,
      treatment: healthEventsTable.treatment,
      status: healthEventsTable.status,
      flockCode: flocks.code,
      houseName: houses.name,
      reportedBy: users.name,
    })
    .from(healthEventsTable)
    .innerJoin(flocks, eq(flocks.id, healthEventsTable.flockId))
    .leftJoin(houses, eq(houses.id, healthEventsTable.houseId))
    .leftJoin(users, eq(users.id, healthEventsTable.reportedById))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(healthEventsTable.occurredOn), desc(healthEventsTable.id))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => {
    const statusDisplay = display(HEALTH_STATUS, row.status);
    return {
      id: row.id,
      date: formatDate(row.occurredOn),
      reportedBy: `Reported by ${shortName(row.reportedBy)}`,
      flock: row.flockCode,
      house: row.houseName ?? "—",
      condition: row.condition,
      cases: count(row.cases),
      treatment: row.treatment ?? "Awaiting diagnosis",
      status: statusDisplay.label,
      statusTone: statusDisplay.tone,
      statusKey: row.status,
    };
  });
}

export async function getHealthKpis() {
  const settings = await getFarmSettings();

  const [[events], [shots], [medicines]] = await Promise.all([
    db
      .select({
        activeCases: sql<number>`count(*) filter (where ${healthEventsTable.status} <> 'resolved')::int`,
        affectedFlocks: sql<number>`count(distinct ${healthEventsTable.flockId}) filter (where ${healthEventsTable.status} <> 'resolved')::int`,
        inTreatment: sql<number>`count(*) filter (where ${healthEventsTable.status} = 'in_treatment')::int`,
        escalated: sql<number>`count(*) filter (where ${healthEventsTable.status} = 'escalated')::int`,
      })
      .from(healthEventsTable),
    db
      .select({
        dueSoon: sql<number>`count(*) filter (where ${vaccinations.status} = 'scheduled' and ${vaccinations.scheduledOn} between current_date and current_date + 7)::int`,
        overdue: sql<number>`count(*) filter (where ${vaccinations.status} = 'overdue')::int`,
      })
      .from(vaccinations),
    db
      .select({
        items: sql<number>`count(*)::int`,
        expiring: sql<number>`count(*) filter (where ${inventoryItems.expiryDate} is not null and ${inventoryItems.expiryDate} <= current_date + ${settings.medicineExpiryWarningDays}::int)::int`,
      })
      .from(inventoryItems)
      .where(
        and(eq(inventoryItems.category, "medicine"), eq(inventoryItems.isActive, true)),
      ),
  ]);

  return {
    activeCases: events.activeCases,
    affectedFlocks: events.affectedFlocks,
    inTreatment: events.inTreatment,
    escalated: events.escalated,
    vaccinationsDue: shots.dueSoon + shots.overdue,
    vaccinationsOverdue: shots.overdue,
    medicineItems: medicines.items,
    medicinesExpiring: medicines.expiring,
  };
}

/** Conditions seen before, for the "log health event" picker. */
export async function getHealthConditions() {
  const rows = await db
    .selectDistinct({ condition: healthEventsTable.condition })
    .from(healthEventsTable)
    .orderBy(healthEventsTable.condition);
  return rows.map((row) => row.condition);
}

/** Open cases, used by the dashboard and the flock boards. */
export async function getOpenHealthEvents(limit = 10) {
  return db
    .select({
      id: healthEventsTable.id,
      condition: healthEventsTable.condition,
      cases: healthEventsTable.cases,
      status: healthEventsTable.status,
      occurredOn: healthEventsTable.occurredOn,
      flockCode: flocks.code,
    })
    .from(healthEventsTable)
    .innerJoin(flocks, eq(flocks.id, healthEventsTable.flockId))
    .where(OPEN_STATUSES)
    .orderBy(desc(healthEventsTable.occurredOn))
    .limit(limit);
}
