import {
  Banknote,
  Bell,
  Building2,
  Calendar,
  Check,
  Clock3,
  CreditCard,
  Droplets,
  Gauge,
  Globe,
  HeartPulse,
  Package,
  Plug,
  Ruler,
  Scale,
  Shield,
  Thermometer,
  Undo2,
  Users,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, PanelHead } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/cn";
import {
  farmProfileFields,
  settingsNav,
  thresholdFields,
  thresholdToggles,
  unitFields,
  type SettingsField,
  type SettingsNavIcon,
} from "@/lib/data/settings";

const navIcons: Record<SettingsNavIcon, LucideIcon> = {
  "building-2": Building2,
  users: Users,
  shield: Shield,
  bell: Bell,
  ruler: Ruler,
  gauge: Gauge,
  "heart-pulse": HeartPulse,
  package: Package,
  plug: Plug,
  "credit-card": CreditCard,
};

const fieldIcons: Record<NonNullable<SettingsField["icon"]>, LucideIcon> = {
  globe: Globe,
  "clock-3": Clock3,
  banknote: Banknote,
  scale: Scale,
  thermometer: Thermometer,
  droplets: Droplets,
  calendar: Calendar,
};

function FieldRow({ fields }: { fields: SettingsField[] }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {fields.map((field) => (
        <Input
          key={field.label}
          className="min-w-0 flex-1"
          label={field.label}
          icon={field.icon ? fieldIcons[field.icon] : undefined}
          unit={field.unit}
          defaultValue={field.value}
        />
      ))}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumb={["Settings"]}
        subtitle="Configure how Jayda Farms works for your team."
      >
        <Button variant="secondary" icon={Undo2}>
          Discard
        </Button>
        <Button icon={Check}>Save Changes</Button>
      </PageHeader>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex flex-col gap-1 self-start p-2 lg:w-[250px]">
          {settingsNav.map((item, index) => {
            const Icon = navIcons[item.icon];
            const active = index === 0;
            return (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex items-center gap-2.5 rounded-nav px-3 py-2 text-left text-base transition-colors",
                  active
                    ? "bg-violet-light font-semibold text-violet-deep"
                    : "font-medium text-ink-2 hover:bg-border-soft",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active ? "text-violet" : "text-ink-3",
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Card className="flex flex-col gap-4 p-4">
            <PanelHead
              title="Farm Profile"
              subtitle="Identity and location used across records and reports"
            />
            {farmProfileFields.map((row, index) => (
              <FieldRow key={index} fields={row} />
            ))}
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <PanelHead
              title="Units & Formats"
              subtitle="Applied to every record, chart and export"
            />
            <FieldRow fields={unitFields} />
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <PanelHead
              title="Thresholds & Alerts"
              subtitle="Jayda Farms raises an alert when a value crosses these limits"
            />
            {thresholdFields.map((row, index) => (
              <FieldRow key={index} fields={row} />
            ))}

            <ul className="flex flex-col gap-4 border-t border-border-soft pt-4">
              {thresholdToggles.map((entry) => (
                <li key={entry.title} className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-sm-plus font-medium text-ink">
                      {entry.title}
                    </span>
                    <span className="text-xs-plus text-ink-3">
                      {entry.description}
                    </span>
                  </div>
                  <Toggle label={entry.title} defaultOn={entry.enabled} />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
