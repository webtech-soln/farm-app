"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { eggCollections } from "@/lib/db/schema";
import { eggCollectionSchema, idSchema } from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const EGG_PATHS = ["/", "/eggs", "/houses/[houseId]", "/flocks/[flockId]", "/products"];

export const saveEggCollection = createFormAction({
  schema: eggCollectionSchema,
  capability: "records:write",
  revalidate: EGG_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = { ...blanksToNull(input), recordedById: user.id };

    if (id) {
      const [row] = await db
        .update(eggCollections)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(eggCollections.id, id))
        .returning({ id: eggCollections.id });

      if (!row) throw new ActionError("That collection no longer exists.");
      return { message: "Collection updated.", id: row.id };
    }

    const [row] = await db
      .insert(eggCollections)
      .values(values)
      .returning({ id: eggCollections.id });

    return { message: "Collection recorded.", id: row.id };
  },
});

export const deleteEggCollection = createFormAction({
  schema: idSchema,
  capability: "records:write",
  revalidate: EGG_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(eggCollections)
      .where(eq(eggCollections.id, id))
      .returning({ id: eggCollections.id });

    if (!row) throw new ActionError("That collection no longer exists.");
    return { message: "Collection deleted." };
  },
});
