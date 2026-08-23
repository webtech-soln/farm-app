"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { farmSettings, notificationPreferences } from "@/lib/db/schema";
import {
  farmProfileSchema,
  notificationPreferenceSchema,
  thresholdSettingsSchema,
  unitSettingsSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

/** Thresholds feed the alerts on every board, so the whole app is refreshed. */
const SETTINGS_PATHS = ["/", "/settings"];

/** The configuration lives in a single row, pinned to id 1. */
const SETTINGS_ROW = 1;

export const saveFarmProfile = createFormAction({
  schema: farmProfileSchema,
  capability: "settings:write",
  revalidate: SETTINGS_PATHS,
  successMessage: "Farm profile saved.",
  handler: async (input) => {
    const values = blanksToNull(input);

    await db
      .insert(farmSettings)
      .values({ id: SETTINGS_ROW, ...values })
      .onConflictDoUpdate({
        target: farmSettings.id,
        set: { ...values, updatedAt: new Date() },
      });
  },
});

export const saveUnitSettings = createFormAction({
  schema: unitSettingsSchema,
  capability: "settings:write",
  revalidate: SETTINGS_PATHS,
  successMessage: "Units saved.",
  handler: async (input) => {
    const [row] = await db
      .update(farmSettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(farmSettings.id, SETTINGS_ROW))
      .returning({ id: farmSettings.id });

    if (!row) throw new ActionError("Set up the farm profile first.");
  },
});

export const saveThresholdSettings = createFormAction({
  schema: thresholdSettingsSchema,
  capability: "settings:write",
  revalidate: SETTINGS_PATHS,
  successMessage: "Alert thresholds saved.",
  handler: async (input) => {
    const [row] = await db
      .update(farmSettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(farmSettings.id, SETTINGS_ROW))
      .returning({ id: farmSettings.id });

    if (!row) throw new ActionError("Set up the farm profile first.");
  },
});

/**
 * Channel preferences belong to the person toggling them, not to the farm, so
 * this one only needs a signed-in user.
 */
export const saveNotificationPreference = createFormAction({
  schema: notificationPreferenceSchema,
  capability: "farm:read",
  revalidate: ["/settings", "/notifications"],
  handler: async ({ channel, scope, enabled }, { user }) => {
    await db
      .insert(notificationPreferences)
      .values({ userId: user.id, channel, scope, enabled })
      .onConflictDoUpdate({
        target: [notificationPreferences.userId, notificationPreferences.channel],
        set: { scope, enabled },
      });

    return {
      message: `${channel} notifications ${enabled ? "enabled" : "muted"}.`,
    };
  },
});
