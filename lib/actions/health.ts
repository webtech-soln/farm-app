"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { healthEvents, vaccinations } from "@/lib/db/schema";
import {
  healthEventSchema,
  healthResolveSchema,
  idSchema,
  vaccinationCompleteSchema,
  vaccinationSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const HEALTH_PATHS = ["/", "/health", "/flocks/[flockId]", "/houses/[houseId]"];
const VACCINATION_PATHS = ["/", "/health", "/vaccinations", "/flocks/[flockId]"];

export const saveHealthEvent = createFormAction({
  schema: healthEventSchema,
  capability: "health:write",
  revalidate: HEALTH_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = { ...blanksToNull(input), reportedById: user.id };

    if (id) {
      const [row] = await db
        .update(healthEvents)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(healthEvents.id, id))
        .returning({ id: healthEvents.id });

      if (!row) throw new ActionError("That health case no longer exists.");
      return { message: "Health case updated.", id: row.id };
    }

    const [row] = await db
      .insert(healthEvents)
      .values(values)
      .returning({ id: healthEvents.id });

    return { message: "Health case logged.", id: row.id };
  },
});

export const resolveHealthEvent = createFormAction({
  schema: healthResolveSchema,
  capability: "health:write",
  revalidate: HEALTH_PATHS,
  handler: async ({ id, resolvedOn, notes }) => {
    const [row] = await db
      .update(healthEvents)
      .set({
        status: "resolved",
        resolvedOn,
        ...(notes ? { notes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(healthEvents.id, id))
      .returning({ condition: healthEvents.condition });

    if (!row) throw new ActionError("That health case no longer exists.");
    return { message: `${row.condition} marked resolved.` };
  },
});

export const deleteHealthEvent = createFormAction({
  schema: idSchema,
  capability: "health:write",
  revalidate: HEALTH_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(healthEvents)
      .where(eq(healthEvents.id, id))
      .returning({ id: healthEvents.id });

    if (!row) throw new ActionError("That health case no longer exists.");
    return { message: "Health case deleted." };
  },
});

export const saveVaccination = createFormAction({
  schema: vaccinationSchema,
  capability: "health:write",
  revalidate: VACCINATION_PATHS,
  handler: async ({ id, ...input }) => {
    const values = blanksToNull(input);

    if (id) {
      const [row] = await db
        .update(vaccinations)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(vaccinations.id, id))
        .returning({ id: vaccinations.id });

      if (!row) throw new ActionError("That vaccination no longer exists.");
      return { message: `${input.vaccine} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(vaccinations)
      .values(values)
      .returning({ id: vaccinations.id });

    return { message: `${input.vaccine} scheduled.`, id: row.id };
  },
});

/** The row-level "mark as given" on the vaccination board. */
export const completeVaccination = createFormAction({
  schema: vaccinationCompleteSchema,
  capability: "health:write",
  revalidate: VACCINATION_PATHS,
  handler: async ({ id, administeredAt, doses, notes }, { user }) => {
    const [row] = await db
      .update(vaccinations)
      .set({
        status: "completed",
        administeredAt: administeredAt ?? new Date(),
        administeredById: user.id,
        ...(doses !== undefined ? { doses } : {}),
        ...(notes ? { notes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(vaccinations.id, id))
      .returning({ vaccine: vaccinations.vaccine });

    if (!row) throw new ActionError("That vaccination no longer exists.");
    return { message: `${row.vaccine} recorded as administered.` };
  },
});

export const cancelVaccination = createFormAction({
  schema: idSchema,
  capability: "health:write",
  revalidate: VACCINATION_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .update(vaccinations)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(vaccinations.id, id))
      .returning({ vaccine: vaccinations.vaccine });

    if (!row) throw new ActionError("That vaccination no longer exists.");
    return { message: `${row.vaccine} cancelled.` };
  },
});
