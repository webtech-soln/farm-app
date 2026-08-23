"use server";

import { count, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/lib/db";
import { dailyRecords, flocks } from "@/lib/db/schema";
import { dbId, optionalIsoDate } from "@/lib/validation/common";
import { flockSchema, idSchema } from "@/lib/validation/schemas";

import { ActionError, createFormAction } from "./handler";
import { todayIso } from "@/lib/date";

const FLOCK_PATHS = [
  "/",
  "/flocks",
  "/flocks/[flockId]",
  "/houses",
  "/houses/[houseId]",
];

export const saveFlock = createFormAction({
  schema: flockSchema,
  capability: "farm:write",
  revalidate: FLOCK_PATHS,
  handler: async ({ id, ...values }) => {
    if (id) {
      const [row] = await db
        .update(flocks)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(flocks.id, id))
        .returning({ id: flocks.id });

      if (!row) throw new ActionError("That flock no longer exists.");
      return { message: `Flock ${values.code} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(flocks)
      .values(values)
      .returning({ id: flocks.id });

    return { message: `Flock ${values.code} placed.`, id: row.id };
  },
});

/**
 * The end of a cycle. Closing keeps the flock and its history queryable, which
 * is what the flock detail board reports on, unlike a delete.
 */
export const closeFlock = createFormAction({
  schema: z.object({ id: dbId, closedOn: optionalIsoDate }),
  capability: "farm:write",
  revalidate: FLOCK_PATHS,
  handler: async ({ id, closedOn }) => {
    const [row] = await db
      .update(flocks)
      .set({
        status: "closed",
        closedOn: closedOn ?? todayIso(),
        updatedAt: new Date(),
      })
      .where(eq(flocks.id, id))
      .returning({ code: flocks.code });

    if (!row) throw new ActionError("That flock no longer exists.");
    return { message: `Flock ${row.code} closed.` };
  },
});

/** Only a flock that never accumulated records can be removed outright. */
export const deleteFlock = createFormAction({
  schema: idSchema,
  capability: "farm:write",
  revalidate: FLOCK_PATHS,
  handler: async ({ id }) => {
    const [{ value: records }] = await db
      .select({ value: count() })
      .from(dailyRecords)
      .where(eq(dailyRecords.flockId, id));

    if (records > 0) {
      throw new ActionError(
        "This flock has daily records. Close it instead of deleting it.",
      );
    }

    const [row] = await db
      .delete(flocks)
      .where(eq(flocks.id, id))
      .returning({ code: flocks.code });

    if (!row) throw new ActionError("That flock no longer exists.");
    return { message: `Flock ${row.code} deleted.` };
  },
});
