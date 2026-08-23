"use server";

import { and, count, eq, ne } from "drizzle-orm";

import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { idSchema, userSchema } from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const PEOPLE_PATHS = ["/employees", "/settings", "/tasks", "/deliveries"];

/** The farm must keep at least one account that can reach the settings board. */
async function assertAnotherOwnerRemains(userId: number) {
  const [{ value: owners }] = await db
    .select({ value: count() })
    .from(users)
    .where(
      and(eq(users.role, "owner"), eq(users.isActive, true), ne(users.id, userId)),
    );

  if (owners === 0) {
    throw new ActionError(
      "This is the last active owner. Promote another account first.",
    );
  }
}

export const saveUser = createFormAction({
  schema: userSchema,
  capability: "people:write",
  revalidate: PEOPLE_PATHS,
  handler: async ({ id, password, ...input }, { user }) => {
    const values = blanksToNull(input);

    if (id) {
      const [existing] = await db
        .select({ role: users.role, isActive: users.isActive })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existing) throw new ActionError("That person no longer exists.");

      // Losing your own access mid-edit, or removing the last owner, would
      // lock the farm out of its own settings.
      if (id === user.id && !input.isActive) {
        throw new ActionError("You cannot deactivate your own account.");
      }
      if (
        existing.role === "owner" &&
        existing.isActive &&
        (input.role !== "owner" || !input.isActive)
      ) {
        await assertAnotherOwnerRemains(id);
      }

      const [row] = await db
        .update(users)
        .set({
          ...values,
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!row) throw new ActionError("That person no longer exists.");

      if (!input.isActive) {
        await db.delete(sessions).where(eq(sessions.userId, id));
      }

      return { message: `${input.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(users)
      .values({
        ...values,
        // The schema already refuses a new account without one.
        passwordHash: password ? await hashPassword(password) : null,
      })
      .returning({ id: users.id });

    return { message: `${input.name} added to the team.`, id: row.id };
  },
});

/**
 * People are deactivated rather than deleted: their name stays on the records,
 * tasks and orders they touched.
 */
export const deactivateUser = createFormAction({
  schema: idSchema,
  capability: "people:write",
  revalidate: PEOPLE_PATHS,
  handler: async ({ id }, { user }) => {
    if (id === user.id) {
      throw new ActionError("You cannot deactivate your own account.");
    }

    const [existing] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existing) throw new ActionError("That person no longer exists.");
    if (existing.role === "owner") await assertAnotherOwnerRemains(id);

    const [row] = await db
      .update(users)
      .set({ isActive: false, dutyStatus: "off_duty", updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({ name: users.name });

    await db.delete(sessions).where(eq(sessions.userId, id));

    return { message: `${row.name} deactivated.` };
  },
});
