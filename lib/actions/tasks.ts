"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { idSchema, taskSchema, taskStatusSchema } from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const TASK_PATHS = ["/", "/tasks"];

export const saveTask = createFormAction({
  schema: taskSchema,
  capability: "tasks:write",
  revalidate: TASK_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = {
      ...blanksToNull(input),
      // Reopening a task has to clear the completion stamp as well.
      completedAt: input.status === "completed" ? new Date() : null,
    };

    if (id) {
      const [row] = await db
        .update(tasks)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(tasks.id, id))
        .returning({ id: tasks.id });

      if (!row) throw new ActionError("That task no longer exists.");
      return { message: "Task updated.", id: row.id };
    }

    const [row] = await db
      .insert(tasks)
      .values({ ...values, createdById: user.id })
      .returning({ id: tasks.id });

    return { message: "Task created.", id: row.id };
  },
});

export const setTaskStatus = createFormAction({
  schema: taskStatusSchema,
  capability: "tasks:write",
  revalidate: TASK_PATHS,
  handler: async ({ id, status }) => {
    const [row] = await db
      .update(tasks)
      .set({
        status,
        completedAt: status === "completed" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning({ title: tasks.title });

    if (!row) throw new ActionError("That task no longer exists.");

    return {
      message:
        status === "completed" ? `${row.title} completed.` : `${row.title} reopened.`,
    };
  },
});

export const deleteTask = createFormAction({
  schema: idSchema,
  capability: "tasks:write",
  revalidate: TASK_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });

    if (!row) throw new ActionError("That task no longer exists.");
    return { message: "Task deleted." };
  },
});
