import Link from "next/link";
import {
  CalendarX,
  CheckCheck,
  CircleCheckBig,
  CreditCard,
  Link2,
  PackageOpen,
  Receipt,
  Syringe,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { SegmentedControl } from "@/components/ui/tabs";
import { toneSolid } from "@/components/ui/tone";
import { PreferenceToggle } from "@/components/form/preference-toggle";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications";
import { saveNotificationPreference } from "@/lib/actions/settings";
import { requireUser } from "@/lib/auth/session";
import { param } from "@/lib/pagination";
import {
  getDeliveryPreferences,
  getNotificationCounts,
  getNotifications,
  getPrioritySummary,
  type NotificationIcon,
} from "@/lib/data/notifications";

const notificationIcons: Record<NotificationIcon, LucideIcon> = {
  alert: TriangleAlert,
  syringe: Syringe,
  "package-open": PackageOpen,
  "credit-card": CreditCard,
  task: CircleCheckBig,
  "calendar-x": CalendarX,
  receipt: Receipt,
  check: CircleCheckBig,
};

export default async function NotificationsPage({
  searchParams,
}: PageProps<"/notifications">) {
  const user = await requireUser();
  const params = await searchParams;
  const category = param(params, "category");

  const [notifications, notificationCounts, deliveryPreferences, prioritySummary] =
    await Promise.all([
      getNotifications(user.id, category),
      getNotificationCounts(user.id),
      getDeliveryPreferences(user.id),
      getPrioritySummary(user.id),
    ]);

  return (
    <>
      <PageHeader
        title="Notifications"
        breadcrumb={["Notifications"]}
        subtitle="Everything that needs your attention, grouped by area."
      >
        <form action={markAllNotificationsRead}>
          <Button type="submit" variant="secondary" icon={CheckCheck}>
            Mark all as read
          </Button>
        </form>
        <ButtonLink href="/settings" variant="secondary">
          Settings
        </ButtonLink>
      </PageHeader>

      <SegmentedControl
        options={Object.keys(notificationCounts)}
        counts={notificationCounts}
        name="category"
        defaultOption="All"
      />

      <div className="flex flex-col gap-4 xl:flex-row">
        <Card className="flex min-w-0 flex-1 flex-col">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className="flex items-start gap-3 border-b border-border-soft p-4 last:border-b-0 hover:bg-bg"
            >
              {notification.unread && !notification.broadcast ? (
                <form action={markNotificationRead} className="mt-3 shrink-0">
                  <input type="hidden" name="id" value={notification.id} />
                  <button
                    type="submit"
                    title="Mark as read"
                    aria-label={`Mark "${notification.title}" as read`}
                    className="block size-2 rounded-full bg-violet"
                  />
                </form>
              ) : (
                <span
                  className={`mt-3 size-2 shrink-0 rounded-full ${
                    notification.unread ? "bg-violet" : "bg-transparent"
                  }`}
                />
              )}
              <IconChip
                icon={notificationIcons[notification.icon]}
                tone={notification.tone}
                size={34}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-ink">
                    {notification.title}
                  </h2>
                  <span className="rounded-[5px] bg-border-soft px-1.5 py-0.5 text-3xs font-semibold text-ink-3">
                    {notification.category}
                  </span>
                  <span className="flex-1" />
                  <span className="text-xs text-ink-3">
                    {notification.time}
                  </span>
                </div>

                <p className="text-sm leading-[1.5] text-ink-2">
                  {notification.description}
                </p>

                <div className="flex items-center gap-1.5">
                  <Link2 className="size-3.5 shrink-0 text-ink-3" />
                  <span className="truncate text-xs font-medium text-ink-3">
                    {notification.link}
                  </span>
                </div>
              </div>

              {notification.href ? (
                <Link
                  href={notification.href}
                  className="shrink-0 rounded-[7px] border border-border-hair px-2.5 py-1.5 text-sm font-semibold text-violet-deep hover:bg-violet-50"
                >
                  {notification.action}
                </Link>
              ) : (
                <span className="shrink-0 rounded-[7px] border border-border-hair px-2.5 py-1.5 text-sm font-semibold text-ink-3">
                  {notification.action}
                </span>
              )}
            </article>
          ))}
        </Card>

        <div className="flex flex-col gap-4 xl:w-[340px]">
          <Card className="flex flex-col gap-4 p-4">
            <PanelHead
              title="Delivery Preferences"
              subtitle="How you receive alerts"
            />
            <ul className="flex flex-col gap-4">
              {deliveryPreferences.map((preference) => (
                <li
                  key={preference.channel}
                  className="flex items-center gap-3"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm-plus font-medium text-ink">
                      {preference.channel}
                    </span>
                    <span className="truncate text-xs text-ink-3">
                      {preference.scope}
                    </span>
                  </div>
                  <PreferenceToggle
                    action={saveNotificationPreference}
                    channel={preference.channel}
                    scope={preference.scope}
                    enabled={preference.enabled}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <PanelHead
              title="Priority Summary"
              subtitle="Unresolved by severity"
            />
            <ul className="flex flex-col gap-3">
              {prioritySummary.map((entry) => (
                <li key={entry.label} className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${toneSolid[entry.tone]}`}
                  />
                  <span className="flex-1 text-sm-plus text-ink-2">
                    {entry.label}
                  </span>
                  <span className="text-base-plus font-semibold text-ink">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
