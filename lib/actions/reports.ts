"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { reports } from "@/lib/db/schema";
import { idSchema, reportRequestSchema } from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const REPORT_PATHS = ["/reports"];

/**
 * Queues a report. The row is the request itself — it is picked up as
 * "Queued" on the register until a generator produces the file and moves it to
 * "ready" with a size.
 */
export const requestReport = createFormAction({
  schema: reportRequestSchema,
  capability: "farm:write",
  revalidate: REPORT_PATHS,
  handler: async (input, { user }) => {
    const [row] = await db
      .insert(reports)
      .values({
        ...blanksToNull(input),
        origin: "manual",
        status: "queued",
        generatedById: user.id,
      })
      .returning({ id: reports.id });

    return { message: `${input.name} queued.`, id: row.id };
  },
});

export const deleteReport = createFormAction({
  schema: idSchema,
  capability: "farm:write",
  revalidate: REPORT_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(reports)
      .where(eq(reports.id, id))
      .returning({ name: reports.name });

    if (!row) throw new ActionError("That report no longer exists.");
    return { message: `${row.name} removed.` };
  },
});
