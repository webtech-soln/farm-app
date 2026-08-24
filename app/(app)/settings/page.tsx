import {
  Bell,
  Building2,
  CreditCard,
  Gauge,
  HeartPulse,
  Lock,
  Package,
  Plug,
  Ruler,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  CheckboxField,
  NumberField,
  TextField,
} from "@/components/form/fields";
import { PageForm } from "@/components/form/page-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, PanelHead } from "@/components/ui/card";
import { changePassword } from "@/lib/actions/auth";
import {
  saveFarmProfile,
  saveThresholdSettings,
  saveUnitSettings,
} from "@/lib/actions/settings";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { capabilitiesFor } from "@/lib/auth/permissions";
import {
  getFarmProfileFields,
  getThresholdFields,
  getThresholdToggles,
  getUnitFields,
  settingsNav,
  type SettingsField,
  type SettingsNavIcon,
} from "@/lib/data/settings";
import { requirePageAccess } from "@/lib/auth/route-access";

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


/** A row of settings inputs, each posting under its own column name. */
function FieldRow({
  fields,
  numeric,
}: {
  fields: SettingsField[];
  /** Threshold rows post numbers; profile and unit rows post text. */
  numeric?: boolean;
}) {
  const Field = numeric ? NumberField : TextField;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {fields.map((field) => (
        <Field
          key={field.name}
          className="min-w-0 flex-1"
          name={field.name}
          label={field.label}
          icon={field.icon}
          unit={field.unit}
          step={numeric ? 0.1 : undefined}
          defaultValue={field.value}
        />
      ))}
    </div>
  );
}

export default async function SettingsPage() {
  await requirePageAccess("settings:read");

  const [user, farmProfileFields, unitFields, thresholdFields, thresholdToggles] =
    await Promise.all([
      requireUser(),
      getFarmProfileFields(),
      getUnitFields(),
      getThresholdFields(),
      getThresholdToggles(),
    ]);

  const capabilities = capabilitiesFor(user.role);
  const canEditSettings = capabilities.includes("settings:write");

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumb={["Settings"]}
        subtitle="Configure how Jayda Farms works for your team."
      />

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex flex-col gap-1 self-start p-2 lg:w-[250px]">
          {settingsNav.map((item) => {
            const Icon = navIcons[item.icon];
            return (
              <a
                key={item.label}
                href={`#${item.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                className="flex items-center gap-2.5 rounded-nav px-3 py-2 text-left text-base font-medium text-ink-2 transition-colors hover:bg-border-soft"
              >
                <Icon className="size-4 shrink-0 text-ink-3" />
                {item.label}
              </a>
            );
          })}
        </Card>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {canEditSettings ? null : (
            <Card className="p-4">
              <p className="text-base text-ink-2">
                Your role ({ROLE_LABELS[user.role]}) can read these settings but
                not change them. Ask a farm owner to make edits.
              </p>
            </Card>
          )}

          <Card className="flex flex-col gap-4 p-4" id="farm-profile">
            <PanelHead
              title="Farm Profile"
              subtitle="Identity and location used across records and reports"
            />
            <PageForm
              action={saveFarmProfile}
              keepValues
              buttons={[{ label: "Save profile" }]}
            >
              {farmProfileFields.map((row) => (
                <FieldRow key={row[0].name} fields={row} />
              ))}
            </PageForm>
          </Card>

          <Card className="flex flex-col gap-4 p-4" id="units-formats">
            <PanelHead
              title="Units & Formats"
              subtitle="Applied to every record, chart and export"
            />
            <PageForm
              action={saveUnitSettings}
              keepValues
              buttons={[{ label: "Save units" }]}
            >
              <FieldRow fields={unitFields} />
            </PageForm>
          </Card>

          <Card className="flex flex-col gap-4 p-4" id="alerts-thresholds">
            <PanelHead
              title="Thresholds & Alerts"
              subtitle="Jayda Farms raises an alert when a value crosses these limits"
            />
            <PageForm
              action={saveThresholdSettings}
              keepValues
              buttons={[{ label: "Save thresholds" }]}
            >
              {thresholdFields.map((row) => (
                <FieldRow key={row[0].name} fields={row} numeric />
              ))}

              <ul className="flex flex-col gap-4 border-t border-border-soft pt-4">
                {thresholdToggles.map((entry) => (
                  <li key={entry.name} className="flex items-center gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm-plus font-medium text-ink">
                        {entry.title}
                      </span>
                      <span className="text-xs-plus text-ink-3">
                        {entry.description}
                      </span>
                    </div>
                    <CheckboxField
                      name={entry.name}
                      label=""
                      defaultChecked={entry.enabled}
                    />
                  </li>
                ))}
              </ul>
            </PageForm>
          </Card>

          <Card className="flex flex-col gap-4 p-4" id="roles-permissions">
            <PanelHead
              title="Roles & Permissions"
              subtitle="What your role can change across the boards"
            />
            <div className="flex flex-col gap-2">
              <p className="text-base text-ink-2">
                You are signed in as{" "}
                <span className="font-semibold text-ink">{user.name}</span> ·{" "}
                {ROLE_LABELS[user.role]}.
              </p>
              <ul className="flex flex-wrap gap-2">
                {capabilities.map((capability) => (
                  <li
                    key={capability}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-deep"
                  >
                    {capability}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-3">
                Roles are assigned on the Employees board.
              </p>
            </div>
          </Card>

          <Card className="flex flex-col gap-4 p-4" id="security">
            <PanelHead
              title="Security"
              subtitle="Changing your password signs out every other device"
            />
            <PageForm action={changePassword} buttons={[{ label: "Change password" }]}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <TextField
                  className="min-w-0 flex-1"
                  name="currentPassword"
                  label="Current password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
                <TextField
                  className="min-w-0 flex-1"
                  name="newPassword"
                  label="New password"
                  type="password"
                  required
                  autoComplete="new-password"
                  hint="At least 10 characters, with a number and mixed case."
                />
                <TextField
                  className="min-w-0 flex-1"
                  name="confirmPassword"
                  label="Confirm new password"
                  type="password"
                  required
                  autoComplete="new-password"
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-ink-3">
                <Lock className="size-3.5" />
                Sessions on other devices end as soon as the password changes.
              </p>
            </PageForm>
          </Card>
        </div>
      </div>
    </>
  );
}
