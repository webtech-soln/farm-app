"use server";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  dailyRecords,
  flocks,
  mortalityRecords,
  weightRecords,
} from "@/lib/db/schema";
import {
  dailyRecordSchema,
  idSchema,
  mortalitySchema,
  mortalityStatusSchema,
  weightRecordSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const DAILY_PATHS = [
  "/",
  "/records/daily",
  "/houses",
  "/houses/[houseId]",
  "/flocks",
  "/flocks/[flockId]",
  "/eggs",
];

const MORTALITY_PATHS = [
  "/",
  "/records/mortality",
  "/flocks",
  "/flocks/[flockId]",
  "/health",
];

const WEIGHT_PATHS = ["/records/weight", "/flocks", "/flocks/[flockId]"];

/**
 * The submitted daily record is the ledger the bird count is read from, so a
 * submission carries the closing balance onto the flock — but only when it is
 * the newest submitted day, otherwise a late correction to an older date would
 * roll the count backwards.
 */
async function syncFlockCount(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  flockId: number,
  recordDate: string,
  closingBirds: number,
) {
  const [latest] = await tx
    .select({ recordDate: dailyRecords.recordDate })
    .from(dailyRecords)
    .where(
      and(eq(dailyRecords.flockId, flockId), eq(dailyRecords.status, "submitted")),
    )
    .orderBy(desc(dailyRecords.recordDate))
    .limit(1);

  if (!latest || latest.recordDate > recordDate) return;

  await tx
    .update(flocks)
    .set({ currentCount: closingBirds, updatedAt: new Date() })
    .where(eq(flocks.id, flockId));
}

export const saveDailyRecord = createFormAction({
  schema: dailyRecordSchema,
  capability: "records:write",
  revalidate: DAILY_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    // Derived, never submitted: the form only collects the movements.
    const closingBirds =
      input.startingBirds - input.deaths - input.culls - input.transfersOut;

    const values = {
      ...blanksToNull(input),
      closingBirds,
      recordedById: user.id,
    };

    return db.transaction(async (tx) => {
      let recordId: number;

      if (id) {
        const [row] = await tx
          .update(dailyRecords)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(dailyRecords.id, id))
          .returning({ id: dailyRecords.id });

        if (!row) throw new ActionError("That record no longer exists.");
        recordId = row.id;
      } else {
        const [row] = await tx
          .insert(dailyRecords)
          .values(values)
          .returning({ id: dailyRecords.id });
        recordId = row.id;
      }

      if (input.status === "submitted" && input.flockId) {
        await syncFlockCount(tx, input.flockId, input.recordDate, closingBirds);
      }

      return {
        message:
          input.status === "submitted"
            ? "Daily record submitted."
            : "Draft saved.",
        id: recordId,
      };
    });
  },
});

export const deleteDailyRecord = createFormAction({
  schema: idSchema,
  capability: "records:write",
  revalidate: DAILY_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(dailyRecords)
      .where(eq(dailyRecords.id, id))
      .returning({ id: dailyRecords.id });

    if (!row) throw new ActionError("That record no longer exists.");
    return { message: "Daily record deleted." };
  },
});

/**
 * Mortality is logged separately from the daily record so a loss can be
 * reported the moment it is found. The bird count still follows the daily
 * record, which is where the same deaths are reconciled.
 */
export const saveMortalityRecord = createFormAction({
  schema: mortalitySchema,
  capability: "records:write",
  revalidate: MORTALITY_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = { ...blanksToNull(input), recordedById: user.id };

    // A flock cannot lose more birds than it has. The schema can only bound
    // the figure in the abstract; the flock is what makes a number wrong, and
    // an extra digit typed into this field is otherwise saved without comment.
    const [flock] = await db
      .select({ code: flocks.code, currentCount: flocks.currentCount })
      .from(flocks)
      .where(eq(flocks.id, input.flockId))
      .limit(1);

    if (!flock) throw new ActionError("That flock no longer exists.");

    if (input.deaths > flock.currentCount) {
      throw new ActionError(
        `${flock.code} has ${flock.currentCount.toLocaleString("en-US")} birds.`,
        {
          deaths: [
            `More than the ${flock.currentCount.toLocaleString("en-US")} birds in this flock.`,
          ],
        },
      );
    }

    if (id) {
      const [row] = await db
        .update(mortalityRecords)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(mortalityRecords.id, id))
        .returning({ id: mortalityRecords.id });

      if (!row) throw new ActionError("That mortality record no longer exists.");
      return { message: "Mortality record updated.", id: row.id };
    }

    const [row] = await db
      .insert(mortalityRecords)
      .values(values)
      .returning({ id: mortalityRecords.id });

    return { message: "Mortality logged.", id: row.id };
  },
});

export const setMortalityStatus = createFormAction({
  schema: mortalityStatusSchema,
  capability: "records:write",
  revalidate: MORTALITY_PATHS,
  handler: async ({ id, status }) => {
    const [row] = await db
      .update(mortalityRecords)
      .set({ status, updatedAt: new Date() })
      .where(eq(mortalityRecords.id, id))
      .returning({ id: mortalityRecords.id });

    if (!row) throw new ActionError("That mortality record no longer exists.");
    return { message: "Status updated." };
  },
});

export const deleteMortalityRecord = createFormAction({
  schema: idSchema,
  capability: "records:write",
  revalidate: MORTALITY_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(mortalityRecords)
      .where(eq(mortalityRecords.id, id))
      .returning({ id: mortalityRecords.id });

    if (!row) throw new ActionError("That mortality record no longer exists.");
    return { message: "Mortality record deleted." };
  },
});

export const saveWeightRecord = createFormAction({
  schema: weightRecordSchema,
  capability: "records:write",
  revalidate: WEIGHT_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = { ...blanksToNull(input), recordedById: user.id };

    if (id) {
      const [row] = await db
        .update(weightRecords)
        .set(values)
        .where(eq(weightRecords.id, id))
        .returning({ id: weightRecords.id });

      if (!row) throw new ActionError("That weight record no longer exists.");
      return { message: "Weight record updated.", id: row.id };
    }

    const [row] = await db
      .insert(weightRecords)
      .values(values)
      .returning({ id: weightRecords.id });

    return { message: "Weight sample recorded.", id: row.id };
  },
});

export const deleteWeightRecord = createFormAction({
  schema: idSchema,
  capability: "records:write",
  revalidate: WEIGHT_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(weightRecords)
      .where(eq(weightRecords.id, id))
      .returning({ id: weightRecords.id });

    if (!row) throw new ActionError("That weight record no longer exists.");
    return { message: "Weight record deleted." };
  },
});
