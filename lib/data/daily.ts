import "server-only";

import { and, desc, eq, lt, ne } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  dailyRecords,
  flocks as flocksTable,
  houses as housesTable,
  users,
} from "@/lib/db/schema";

import { formatDate } from "./common";
import { todayIso } from "@/lib/date";

export type DailyRecordValues = {
  id: number;
  houseId: number;
  flockId: number | null;
  recordDate: string;
  startingBirds: number;
  deaths: number;
  culls: number;
  transfersOut: number;
  closingBirds: number;
  feedKg: number | null;
  feedType: string | null;
  feedBatch: string | null;
  waterLitres: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  humidityPct: number | null;
  ventilation: string | null;
  eggsCollected: number | null;
  eggsBroken: number | null;
  avgWeightKg: number | null;
  sampleSize: number | null;
  uniformityPct: number | null;
  notes: string | null;
  status: string;
};

const today = todayIso;

/**
 * Everything the Daily Records board needs for one house on one date: the
 * pickers, the record already filed for that day (so the form edits rather
 * than duplicates it — the table holds one row per house per date), and the
 * opening balance carried from the last submitted day.
 */
export async function getDailyRecordForm({
  houseCode,
  flockCode,
  date,
}: {
  houseCode?: string;
  flockCode?: string;
  date?: string;
} = {}) {
  const recordDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today();

  const [houses, flocks] = await Promise.all([
    db
      .select({
        id: housesTable.id,
        code: housesTable.code,
        name: housesTable.name,
        capacity: housesTable.capacity,
      })
      .from(housesTable)
      .orderBy(housesTable.code),
    db
      .select({
        id: flocksTable.id,
        code: flocksTable.code,
        type: flocksTable.type,
        breed: flocksTable.breed,
        houseId: flocksTable.houseId,
        currentCount: flocksTable.currentCount,
      })
      .from(flocksTable)
      .where(ne(flocksTable.status, "closed"))
      .orderBy(flocksTable.code),
  ]);

  const house =
    houses.find((row) => row.code === houseCode) ??
    (flockCode
      ? houses.find(
          (row) =>
            row.id === flocks.find((flock) => flock.code === flockCode)?.houseId,
        )
      : undefined) ??
    houses[0];

  const houseFlocks = house
    ? flocks.filter((flock) => flock.houseId === house.id)
    : [];
  const flock =
    houseFlocks.find((row) => row.code === flockCode) ?? houseFlocks[0];

  const existing = house
    ? (
        await db
          .select()
          .from(dailyRecords)
          .where(
            and(
              eq(dailyRecords.houseId, house.id),
              eq(dailyRecords.recordDate, recordDate),
            ),
          )
          .limit(1)
      )[0]
    : undefined;

  // The opening balance is the previous day's closing count, falling back to
  // the flock's live count when this is the first record of a placement.
  const previous = house
    ? (
        await db
          .select({
            closingBirds: dailyRecords.closingBirds,
            recordDate: dailyRecords.recordDate,
          })
          .from(dailyRecords)
          .where(
            and(
              eq(dailyRecords.houseId, house.id),
              lt(dailyRecords.recordDate, recordDate),
              eq(dailyRecords.status, "submitted"),
            ),
          )
          .orderBy(desc(dailyRecords.recordDate))
          .limit(1)
      )[0]
    : undefined;

  const recordedBy = existing?.recordedById
    ? (
        await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, existing.recordedById))
          .limit(1)
      )[0]?.name ?? null
    : null;

  const startingBirds =
    existing?.startingBirds ??
    previous?.closingBirds ??
    flock?.currentCount ??
    0;

  return {
    recordDate,
    houses,
    flocks,
    house,
    flock,
    houseFlocks,
    /** A record already filed for this house/date is edited, not duplicated. */
    existing: (existing as DailyRecordValues | undefined) ?? null,
    startingBirds,
    openingSource: existing
      ? "this record"
      : previous
        ? `closing balance of ${formatDate(previous.recordDate)}`
        : flock
          ? `live count of flock ${flock.code}`
          : "no earlier record",
    recordedBy,
    isLayer: flock?.type === "layer",
  };
}

/** The `View History` panel: the most recent records for the same house. */
export async function getRecentDailyRecords(houseId: number, limit = 8) {
  const rows = await db
    .select({
      id: dailyRecords.id,
      recordDate: dailyRecords.recordDate,
      deaths: dailyRecords.deaths,
      closingBirds: dailyRecords.closingBirds,
      feedKg: dailyRecords.feedKg,
      status: dailyRecords.status,
    })
    .from(dailyRecords)
    .where(eq(dailyRecords.houseId, houseId))
    .orderBy(desc(dailyRecords.recordDate))
    .limit(limit);

  return rows.map((row) => ({
    ...row,
    dateLabel: formatDate(row.recordDate),
  }));
}
