"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";

import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { idSchema } from "@/lib/validation/schemas";

import { formDataToObject } from "./handler";

const NOTIFICATION_PATHS = ["/", "/notifications"];

function revalidate() {
  for (const path of NOTIFICATION_PATHS) revalidatePath(path);
}

/**
 * Read state is scoped to the caller's own rows. A broadcast (`userId` null) is
 * shared by everyone, so one person cannot mark it read for the whole farm.
 *
 * These are plain button actions rather than validated forms: there is nothing
 * to report back, so a row that has already gone is simply a no-op.
 */
export async function markNotificationRead(formData: FormData) {
  const user = await requireUser();

  const parsed = idSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return;

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, parsed.data.id),
        eq(notifications.userId, user.id),
      ),
    );

  revalidate();
}

export async function markAllNotificationsRead() {
  const user = await requireUser();

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  revalidate();
}
