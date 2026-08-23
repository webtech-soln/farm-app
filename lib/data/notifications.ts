import "server-only";

import { and, desc, eq, isNull, or, sql } from "drizzle-orm";

import type { Tone } from "@/components/ui/tone";
import { db } from "@/lib/db";
import {
  notificationPreferences,
  notifications as table,
} from "@/lib/db/schema";

import { humanise, relativeTime } from "./common";

export type NotificationIcon =
  | "alert"
  | "syringe"
  | "package-open"
  | "credit-card"
  | "task"
  | "calendar-x"
  | "receipt"
  | "check";

const ICONS: NotificationIcon[] = [
  "alert",
  "syringe",
  "package-open",
  "credit-card",
  "task",
  "calendar-x",
  "receipt",
  "check",
];

/** The stored icon is free text, so an unknown value falls back to the bell. */
function iconFor(value: string): NotificationIcon {
  return ICONS.includes(value as NotificationIcon)
    ? (value as NotificationIcon)
    : "alert";
}

export type NotificationRow = {
  id: number;
  icon: NotificationIcon;
  tone: Tone;
  title: string;
  category: string;
  time: string;
  description: string;
  link: string;
  href: string | null;
  action: string;
  unread?: boolean;
  /** A broadcast cannot be marked read by one person on everyone's behalf. */
  broadcast: boolean;
};

/** The categories the segmented control lists, in board order. */
const CATEGORIES = [
  "health",
  "inventory",
  "tasks",
  "finance",
  "sales",
  "system",
] as const;

/** Own notifications plus anything broadcast to the whole farm. */
function visibleTo(userId: number) {
  return or(eq(table.userId, userId), isNull(table.userId));
}

export async function getNotifications(
  userId: number,
  category?: string,
  limit = 50,
): Promise<NotificationRow[]> {
  const conditions = [visibleTo(userId)];
  if (category && category !== "All") {
    conditions.push(sql`${table.category}::text = ${category.toLowerCase()}`);
  }

  const rows = await db
    .select({
      id: table.id,
      userId: table.userId,
      category: table.category,
      tone: table.tone,
      icon: table.icon,
      title: table.title,
      description: table.description,
      linkLabel: table.linkLabel,
      linkHref: table.linkHref,
      actionLabel: table.actionLabel,
      readAt: table.readAt,
      createdAt: table.createdAt,
    })
    .from(table)
    .where(and(...conditions))
    .orderBy(desc(table.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    icon: iconFor(row.icon),
    tone: row.tone as Tone,
    title: row.title,
    category: humanise(row.category),
    time: relativeTime(row.createdAt),
    description: row.description,
    link: row.linkLabel ?? "—",
    href: row.linkHref,
    action: row.actionLabel ?? "Open",
    unread: row.readAt === null ? true : undefined,
    broadcast: row.userId === null,
  }));
}

/** Tab counts: unread per category, plus the "All" total. */
export async function getNotificationCounts(
  userId: number,
): Promise<Record<string, number>> {
  const rows = await db
    .select({
      category: table.category,
      unread: sql<number>`count(*) filter (where ${table.readAt} is null)::int`,
    })
    .from(table)
    .where(visibleTo(userId))
    .groupBy(table.category);

  const byCategory = new Map(rows.map((row) => [row.category, row.unread]));

  const counts: Record<string, number> = {
    All: rows.reduce((total, row) => total + row.unread, 0),
  };
  for (const category of CATEGORIES) {
    counts[humanise(category)] = byCategory.get(category) ?? 0;
  }

  return counts;
}

export type DeliveryPreference = {
  channel: string;
  scope: string;
  enabled: boolean;
};

/** Channels are fixed; a missing row means the channel has never been set up. */
const DEFAULT_PREFERENCES: DeliveryPreference[] = [
  { channel: "In-app", scope: "All categories", enabled: true },
  { channel: "Email", scope: "Not configured", enabled: false },
  { channel: "SMS", scope: "Not configured", enabled: false },
  { channel: "WhatsApp", scope: "Not configured", enabled: false },
];

export async function getDeliveryPreferences(
  userId: number,
): Promise<DeliveryPreference[]> {
  const rows = await db
    .select({
      channel: notificationPreferences.channel,
      scope: notificationPreferences.scope,
      enabled: notificationPreferences.enabled,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));

  const byChannel = new Map(rows.map((row) => [row.channel, row]));

  return DEFAULT_PREFERENCES.map(
    (fallback) => byChannel.get(fallback.channel) ?? fallback,
  );
}

/** Unresolved notifications grouped by how loud they are. */
export async function getPrioritySummary(userId: number) {
  const [row] = await db
    .select({
      critical: sql<number>`count(*) filter (where ${table.tone} = 'error')::int`,
      warning: sql<number>`count(*) filter (where ${table.tone} = 'warning')::int`,
      informational: sql<number>`count(*) filter (where ${table.tone} not in ('error','warning'))::int`,
    })
    .from(table)
    .where(and(visibleTo(userId), isNull(table.readAt)));

  return [
    { label: "Critical", count: String(row.critical), tone: "error" as Tone },
    { label: "Warning", count: String(row.warning), tone: "warning" as Tone },
    {
      label: "Informational",
      count: String(row.informational),
      tone: "info" as Tone,
    },
  ];
}
