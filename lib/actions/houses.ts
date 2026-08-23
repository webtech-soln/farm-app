"use server";

import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { flocks, houses } from "@/lib/db/schema";
import { houseSchema, idSchema } from "@/lib/validation/schemas";

import { ActionError, createFormAction } from "./handler";

/** A house shows up on the dashboard, the flock board and its own detail page. */
const HOUSE_PATHS = ["/", "/houses", "/houses/[houseId]", "/flocks"];

export const saveHouse = createFormAction({
  schema: houseSchema,
  capability: "farm:write",
  revalidate: HOUSE_PATHS,
  handler: async ({ id, ...values }) => {
    if (id) {
      const [row] = await db
        .update(houses)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(houses.id, id))
        .returning({ id: houses.id });

      if (!row) throw new ActionError("That house no longer exists.");
      return { message: `${values.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(houses)
      .values(values)
      .returning({ id: houses.id });

    return { message: `${values.name} added.`, id: row.id };
  },
});

/**
 * Deleting a house would cascade into its daily records and readings, so a
 * house that still holds a flock has to be emptied first.
 */
export const deleteHouse = createFormAction({
  schema: idSchema,
  capability: "farm:write",
  revalidate: HOUSE_PATHS,
  handler: async ({ id }) => {
    const [{ value: flockCount }] = await db
      .select({ value: count() })
      .from(flocks)
      .where(eq(flocks.houseId, id));

    if (flockCount > 0) {
      throw new ActionError(
        "Move or close the flocks in this house before deleting it.",
      );
    }

    const [row] = await db
      .delete(houses)
      .where(eq(houses.id, id))
      .returning({ name: houses.name });

    if (!row) throw new ActionError("That house no longer exists.");
    return { message: `${row.name} deleted.` };
  },
});
