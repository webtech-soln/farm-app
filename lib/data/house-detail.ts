import "server-only";

import {
  ClipboardCheck,
  Scale,
  Syringe,
  Thermometer,
  TriangleAlert,
} from "lucide-react";
import { and, asc, desc, eq, gte, sql } from "drizzle-orm";

import type { TimelineEvent } from "@/components/ui/timeline";
import { db } from "@/lib/db";
import {
  dailyRecords,
  flocks,
  houseReadings,
  mortalityRecords,
  users,
  vaccinations,
  weightRecords,
} from "@/lib/db/schema";

import {
  axis,
  CHART_PRIMARY,
  CHART_WARNING,
  count,
  decimal,
  formatTime,
  relativeTime,
  shortName,
  standardFeedKg,
} from "./common";
import { getFarmSettings } from "./settings";
import { isoDaysAgo } from "@/lib/date";

const isoDay = isoDaysAgo;

/**
 * Environment readings land every two hours, so the last twelve rows are one
 * full day. Bars go amber wherever the reading leaves the configured band.
 */
export async function getHouseTemperatureDay(houseId: number) {
  const settings = await getFarmSettings();

  const rows = await db
    .select({
      recordedAt: houseReadings.recordedAt,
      temperatureC: houseReadings.temperatureC,
    })
    .from(houseReadings)
    .where(eq(houseReadings.houseId, houseId))
    .orderBy(desc(houseReadings.recordedAt))
    .limit(12);

  const readings = rows.reverse();
  const values = readings.map((row) => Math.round(row.temperatureC));
  const excursions = values.filter(
    (value) => value < settings.temperatureMinC || value > settings.temperatureMaxC,
  ).length;

  const { max, ticks } = axis(Math.max(...values, 1), 4, (value) =>
    `${Math.round(value)}°`,
  );

  return {
    labels: readings.map((row) =>
      String(row.recordedAt.getHours()).padStart(2, "0"),
    ),
    ticks,
    max,
    values,
    colors: values.map((value) =>
      value < settings.temperatureMinC || value > settings.temperatureMaxC
        ? CHART_WARNING
        : CHART_PRIMARY,
    ),
    excursions,
    band: `${settings.temperatureMinC}–${settings.temperatureMaxC}°C`,
  };
}

/** Closing bird count per day, which is the natural depletion curve. */
export async function getHouseBirdCountTrend(houseId: number, days = 14) {
  const rows = await db
    .select({
      recordDate: dailyRecords.recordDate,
      closingBirds: dailyRecords.closingBirds,
    })
    .from(dailyRecords)
    .where(
      and(
        eq(dailyRecords.houseId, houseId),
        gte(dailyRecords.recordDate, isoDay(days - 1)),
      ),
    )
    .orderBy(asc(dailyRecords.recordDate));

  const values = rows.map((row) => row.closingBirds);
  if (values.length === 0) {
    return { labels: [], ticks: [], min: 0, max: 1, values: [], days };
  }

  // The rail only spans the depletion range, otherwise the drop is invisible.
  const lowest = Math.min(...values);
  const highest = Math.max(...values);
  const padding = Math.max(Math.round((highest - lowest) * 0.25), 10);
  const min = Math.max(lowest - padding, 0);
  const max = highest + padding;
  const ticks = Array.from({ length: 4 }, (_, index) =>
    count(max - ((max - min) / 3) * index),
  );

  return {
    labels: rows.map((row) => row.recordDate.slice(8, 10)),
    ticks,
    min,
    max,
    values,
    days,
  };
}

/** Daily feed intake against the breed standard for the flock's age. */
export async function getHouseFeedConsumption(houseId: number, days = 7) {
  const rows = await db
    .select({
      recordDate: dailyRecords.recordDate,
      feedKg: dailyRecords.feedKg,
      closingBirds: dailyRecords.closingBirds,
      flockType: flocks.type,
      startedOn: flocks.startedOn,
    })
    .from(dailyRecords)
    .leftJoin(flocks, eq(flocks.id, dailyRecords.flockId))
    .where(
      and(
        eq(dailyRecords.houseId, houseId),
        gte(dailyRecords.recordDate, isoDay(days - 1)),
      ),
    )
    .orderBy(asc(dailyRecords.recordDate));

  const actual = rows.map((row) => Math.round(row.feedKg ?? 0));
  const standard = rows.map((row) =>
    row.flockType && row.startedOn
      ? standardFeedKg(row.closingBirds, row.startedOn, row.recordDate, row.flockType)
      : 0,
  );

  const { max, ticks } = axis(Math.max(...actual, ...standard, 1));

  return {
    labels: rows.map((row) =>
      new Date(`${row.recordDate}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
    ),
    ticks,
    max,
    actual,
    standard,
  };
}

/**
 * The activity feed is assembled from the records the house actually produced
 * rather than a stored event log, newest first.
 */
export async function getHouseActivity(
  houseId: number,
  limit = 6,
): Promise<TimelineEvent[]> {
  const settings = await getFarmSettings();

  const [records, deaths, weights, shots, excursion] = await Promise.all([
    db
      .select({
        recordDate: dailyRecords.recordDate,
        createdAt: dailyRecords.createdAt,
        eggsCollected: dailyRecords.eggsCollected,
        feedKg: dailyRecords.feedKg,
        deaths: dailyRecords.deaths,
        recordedBy: users.name,
      })
      .from(dailyRecords)
      .leftJoin(users, eq(users.id, dailyRecords.recordedById))
      .where(eq(dailyRecords.houseId, houseId))
      .orderBy(desc(dailyRecords.recordDate))
      .limit(1),

    db
      .select({
        occurredOn: mortalityRecords.occurredOn,
        occurredAt: mortalityRecords.occurredAt,
        deaths: mortalityRecords.deaths,
        cause: mortalityRecords.cause,
      })
      .from(mortalityRecords)
      .where(eq(mortalityRecords.houseId, houseId))
      .orderBy(desc(mortalityRecords.occurredOn), desc(mortalityRecords.occurredAt))
      .limit(1),

    db
      .select({
        recordedOn: weightRecords.recordedOn,
        avgWeightKg: weightRecords.avgWeightKg,
        standardWeightKg: weightRecords.standardWeightKg,
        sampleSize: weightRecords.sampleSize,
      })
      .from(weightRecords)
      .where(eq(weightRecords.houseId, houseId))
      .orderBy(desc(weightRecords.recordedOn))
      .limit(1),

    db
      .select({
        vaccine: vaccinations.vaccine,
        route: vaccinations.route,
        administeredAt: vaccinations.administeredAt,
        administeredBy: users.name,
      })
      .from(vaccinations)
      .leftJoin(users, eq(users.id, vaccinations.administeredById))
      .where(
        and(eq(vaccinations.houseId, houseId), eq(vaccinations.status, "completed")),
      )
      .orderBy(desc(vaccinations.administeredAt))
      .limit(1),

    db
      .select({
        recordedAt: houseReadings.recordedAt,
        temperatureC: houseReadings.temperatureC,
      })
      .from(houseReadings)
      .where(
        and(
          eq(houseReadings.houseId, houseId),
          gte(houseReadings.recordedAt, sql`now() - interval '24 hours'`),
          sql`${houseReadings.temperatureC} > ${settings.temperatureMaxC}`,
        ),
      )
      .orderBy(desc(houseReadings.temperatureC))
      .limit(1),
  ]);

  const events: { at: Date; event: TimelineEvent }[] = [];

  for (const row of records) {
    const parts = [
      `Eggs ${count(row.eggsCollected ?? 0)}`,
      `feed ${count(row.feedKg ?? 0)} kg`,
      `${count(row.deaths)} mortalities logged by ${shortName(row.recordedBy)}`,
    ];
    events.push({
      at: row.createdAt,
      event: {
        icon: ClipboardCheck,
        tone: "violet",
        title: "Daily record submitted",
        time: relativeTime(row.createdAt),
        description: `${parts.join(" · ")}.`,
      },
    });
  }

  for (const row of excursion) {
    events.push({
      at: row.recordedAt,
      event: {
        icon: Thermometer,
        tone: "warning",
        title: "Temperature excursion",
        time: formatTime(row.recordedAt),
        description: `Reading peaked at ${Math.round(row.temperatureC)}°C, above the ${settings.temperatureMaxC}°C ceiling.`,
      },
    });
  }

  for (const row of weights) {
    const variance =
      row.standardWeightKg === null
        ? null
        : row.avgWeightKg - row.standardWeightKg;
    events.push({
      at: new Date(`${row.recordedOn}T00:00:00`),
      event: {
        icon: Scale,
        tone: "success",
        title: "Weight sampling",
        time: relativeTime(`${row.recordedOn}T00:00:00`),
        description:
          `${count(row.sampleSize)}-bird sample averaged ${decimal(row.avgWeightKg, 2)} kg` +
          (variance === null
            ? "."
            : ` (${variance >= 0 ? "+" : ""}${decimal(variance, 2)} kg vs standard).`),
      },
    });
  }

  for (const row of deaths) {
    events.push({
      at: new Date(`${row.occurredOn}T${row.occurredAt ?? "00:00:00"}`),
      event: {
        icon: TriangleAlert,
        tone: "warning",
        title: "Mortality logged",
        time: relativeTime(`${row.occurredOn}T${row.occurredAt ?? "00:00:00"}`),
        description: `${count(row.deaths)} birds lost · ${row.cause}.`,
      },
    });
  }

  for (const row of shots) {
    if (!row.administeredAt) continue;
    events.push({
      at: row.administeredAt,
      event: {
        icon: Syringe,
        tone: "success",
        title: "Vaccination completed",
        time: relativeTime(row.administeredAt),
        description: `${row.vaccine} (${row.route}) administered by ${shortName(row.administeredBy)}.`,
      },
    });
  }

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, limit)
    .map((entry) => entry.event);
}
