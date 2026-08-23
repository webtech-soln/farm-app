import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import {
  Sidebar,
  SidebarDrawer,
  SidebarDrawerProvider,
} from "@/components/layout/sidebar";
import { SessionWatchdog } from "@/components/layout/session-watchdog";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui/toast";
import { CapabilityProvider } from "@/components/form/capabilities";
import { capabilitiesFor, ROLE_LABELS } from "@/lib/auth/permissions";
import { requireUser, SESSION_IDLE_MS } from "@/lib/auth/session";
import { getNotificationCounts } from "@/lib/data/notifications";
import { getFarmSettings } from "@/lib/data/settings";

/**
 * The session gate for every board. The proxy only sees the cookie, so this is
 * where the signed-in user is actually resolved against the database.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  const [settings, counts] = await Promise.all([
    getFarmSettings(),
    getNotificationCounts(user.id),
  ]);

  const sidebar = {
    user: {
      initials: user.initials,
      name: user.name,
      role: user.jobTitle ?? ROLE_LABELS[user.role],
    },
    farmName: settings.farmName,
    estate: settings.estateName ?? settings.cityState ?? "",
  };

  return (
    <CapabilityProvider value={capabilitiesFor(user.role)}>
      <ToastProvider>
        <SessionWatchdog idleMs={SESSION_IDLE_MS} />
        <SidebarDrawerProvider>
          <div className="flex min-h-screen bg-bg">
            <Sidebar {...sidebar} />
            <SidebarDrawer {...sidebar} />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar
                initials={user.initials}
                estate={settings.estateName ?? settings.farmName}
                unread={counts.All}
              />
              <main className="flex flex-1 flex-col gap-5 p-4 md:p-7">
                {children}
              </main>
              <MobileBottomNav />
            </div>
          </div>
        </SidebarDrawerProvider>
      </ToastProvider>
    </CapabilityProvider>
  );
}
