import Link from "next/link";
import {
  Bird,
  CircleCheckBig,
  CloudCheck,
  Egg,
  History,
  Info,
  NotebookPen,
  Scale,
  Thermometer,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { ClosingBirds } from "@/components/form/closing-birds";
import {
  FormGrid,
  FullWidth,
  HiddenField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction } from "@/components/form/form-dialog";
import { PageForm } from "@/components/form/page-form";
import { RecordContext } from "@/components/form/record-context";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconChip } from "@/components/ui/icon-chip";
import { deleteDailyRecord, saveDailyRecord } from "@/lib/actions/records";
import { getDailyRecordForm, getRecentDailyRecords } from "@/lib/data/daily";
import { getFeedOptions } from "@/lib/data/feed";
import { requirePageAccess } from "@/lib/auth/route-access";

export default async function DailyRecordsPage({
  searchParams,
}: PageProps<"/records/daily">) {
  await requirePageAccess("records:read");

  const { house, flock, date } = await searchParams;

  const form = await getDailyRecordForm({
    houseCode: typeof house === "string" ? house : undefined,
    flockCode: typeof flock === "string" ? flock : undefined,
    date: typeof date === "string" ? date : undefined,
  });

  if (!form.house) {
    return (
      <>
        <PageHeader
          title="Daily Farm Records"
          breadcrumb={["Operations", "Daily Records"]}
        />
        <EmptyState
          icon={Bird}
          title="No houses yet"
          description="Add a house on the Farm Overview board before filing daily records."
        >
          <ButtonLink href="/houses">Go to Farm Overview</ButtonLink>
        </EmptyState>
      </>
    );
  }

  const [feedItems, history] = await Promise.all([
    getFeedOptions(),
    getRecentDailyRecords(form.house.id),
  ]);

  const record = form.existing;

  return (
    <>
      <PageHeader
        title="Daily Farm Records"
        breadcrumb={["Operations", "Daily Records"]}
        subtitle="Log today's house-level operations. Takes about 2 minutes."
      >
        <Link
          href="#history"
          className="inline-flex h-[38px] shrink-0 items-center gap-[7px] rounded-nav border border-border-hair bg-card px-3.5 text-base font-semibold text-ink hover:bg-border-soft"
        >
          <History className="size-[15px]" />
          View History
        </Link>
      </PageHeader>

      <Card className="flex flex-wrap items-end gap-4 p-4">
        <RecordContext
          date={form.recordDate}
          houses={form.houses}
          flocks={form.houseFlocks}
          houseCode={form.house.code}
          flockCode={form.flock?.code}
        />
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 rounded-nav bg-violet-50 px-3 py-2 text-xs-plus font-medium text-violet-deep">
          <CloudCheck className="size-4" />
          {record
            ? `Editing the ${record.status === "draft" ? "draft" : "submitted record"} for this day`
            : "New record for this day"}
        </span>
      </Card>

      <PageForm
        action={saveDailyRecord}
        keepValues
        buttons={[
          {
            label: "Save as draft",
            variant: "secondary",
            name: "status",
            value: "draft",
            pendingLabel: "Saving…",
          },
          {
            label: "Save Daily Record",
            name: "status",
            value: "submitted",
            pendingLabel: "Submitting…",
          },
        ]}
      >
        <HiddenField name="id" value={record?.id} />
        <HiddenField name="houseId" value={form.house.id} />
        <HiddenField name="flockId" value={form.flock?.id} />
        <HiddenField name="recordDate" value={form.recordDate} />

        <div className="grid gap-4 xl:grid-cols-2" data-daily-record-fields>
          <EntrySection
            icon={Bird}
            title="Birds"
            hint={`Opening balance from the ${form.openingSource}`}
          >
            <FormGrid>
              <NumberField
                name="startingBirds"
                label="Starting birds"
                required
                min={0}
                defaultValue={record?.startingBirds ?? form.startingBirds}
              />
              <NumberField
                name="deaths"
                label="Deaths"
                required
                min={0}
                defaultValue={record?.deaths ?? 0}
              />
              <NumberField
                name="culls"
                label="Culls"
                required
                min={0}
                defaultValue={record?.culls ?? 0}
              />
              <NumberField
                name="transfersOut"
                label="Transfers out"
                required
                min={0}
                defaultValue={record?.transfersOut ?? 0}
              />
            </FormGrid>
            <ClosingBirds
              initial={
                (record?.startingBirds ?? form.startingBirds) -
                (record?.deaths ?? 0) -
                (record?.culls ?? 0) -
                (record?.transfersOut ?? 0)
              }
            />
          </EntrySection>

          <EntrySection
            icon={Wheat}
            title="Feed & Water"
            hint="Feed is reconciled against inventory"
          >
            <FormGrid>
              <NumberField
                name="feedKg"
                label="Feed consumed"
                min={0}
                step={0.1}
                unit="kg"
                defaultValue={record?.feedKg ?? ""}
              />
              <SelectField
                name="feedItemId"
                label="Feed item"
                options={feedItems.map((item) => ({
                  value: item.id,
                  label: `${item.name}${item.batch ? ` · ${item.batch}` : ""}`,
                }))}
                placeholder="Not linked"
                defaultValue={""}
              />
              <TextField
                name="feedType"
                label="Feed type"
                placeholder="Broiler finisher"
                defaultValue={record?.feedType ?? ""}
              />
              <TextField
                name="feedBatch"
                label="Feed batch"
                placeholder="FB-1182"
                defaultValue={record?.feedBatch ?? ""}
              />
              <NumberField
                name="waterLitres"
                label="Water consumption"
                min={0}
                step={1}
                unit="L"
                defaultValue={record?.waterLitres ?? ""}
              />
            </FormGrid>
          </EntrySection>

          <EntrySection
            icon={Thermometer}
            title="Environment"
            hint="Readings taken at 08:00 and 14:00"
          >
            <FormGrid>
              <NumberField
                name="tempMinC"
                label="Temperature (min)"
                step={0.1}
                unit="°C"
                defaultValue={record?.tempMinC ?? ""}
              />
              <NumberField
                name="tempMaxC"
                label="Temperature (max)"
                step={0.1}
                unit="°C"
                defaultValue={record?.tempMaxC ?? ""}
              />
              <NumberField
                name="humidityPct"
                label="Humidity"
                min={0}
                max={100}
                step={0.1}
                unit="%"
                defaultValue={record?.humidityPct ?? ""}
              />
              <TextField
                name="ventilation"
                label="Ventilation setting"
                placeholder="Level 3"
                defaultValue={record?.ventilation ?? ""}
              />
            </FormGrid>
          </EntrySection>

          <EntrySection
            icon={Egg}
            title="Production"
            hint="Layer houses only"
          >
            {form.isLayer ? (
              <FormGrid>
                <NumberField
                  name="eggsCollected"
                  label="Eggs collected"
                  min={0}
                  defaultValue={record?.eggsCollected ?? ""}
                />
                <NumberField
                  name="eggsBroken"
                  label="Broken eggs"
                  min={0}
                  defaultValue={record?.eggsBroken ?? ""}
                />
              </FormGrid>
            ) : (
              <Note tone="neutral" icon={Info}>
                {form.flock
                  ? `${form.house.name} holds a broiler flock — egg fields are disabled.`
                  : `${form.house.name} has no active flock — egg fields are disabled.`}
              </Note>
            )}
          </EntrySection>

          <EntrySection
            icon={Scale}
            title="Weight Sampling"
            hint="Sample at least 30 birds for a valid average"
          >
            <FormGrid>
              <NumberField
                name="avgWeightKg"
                label="Average weight"
                min={0}
                step={0.01}
                unit="kg"
                defaultValue={record?.avgWeightKg ?? ""}
              />
              <NumberField
                name="sampleSize"
                label="Sample size"
                min={0}
                unit="birds"
                defaultValue={record?.sampleSize ?? ""}
              />
              <NumberField
                name="uniformityPct"
                label="Uniformity"
                min={0}
                max={100}
                step={0.1}
                unit="%"
                defaultValue={record?.uniformityPct ?? ""}
              />
              <TextField
                name="recordedBy"
                label="Recorded by"
                defaultValue={form.recordedBy ?? "You"}
                disabled
                hint="Taken from your session on save."
              />
            </FormGrid>
          </EntrySection>

          <EntrySection
            icon={NotebookPen}
            title="Notes"
            hint="Optional context for the supervisor"
          >
            <FullWidth>
              <TextAreaField
                name="notes"
                rows={5}
                placeholder="Anything the supervisor should know about today…"
                defaultValue={record?.notes ?? ""}
              />
            </FullWidth>
          </EntrySection>
        </div>

        <Card className="flex flex-wrap items-center gap-3 p-4">
          <span className="flex flex-1 items-center gap-2 text-sm-plus text-ink-2">
            <CircleCheckBig className="size-4 text-success" />
            {form.flock
              ? `Submitting syncs the closing count to flock ${form.flock.code}`
              : "No flock is attached, so no bird count will be synced"}
          </span>
        </Card>
      </PageForm>

      <Card className="flex flex-col scroll-mt-6">
        <div className="flex flex-wrap items-center gap-2.5 px-[18px] py-3.5" id="history">
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <h2 className="text-md font-semibold text-ink">Recent records</h2>
            <p className="text-sm text-ink-2">
              The last {history.length} days filed for {form.house.name}
            </p>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="px-[18px] pb-5 text-base text-ink-2">
            Nothing filed yet — save this form to start the record history for
            this house.
          </p>
        ) : (
          history.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center gap-3 border-t border-border-soft px-[18px] py-3"
            >
              <Link
                href={`/records/daily?house=${form.house!.code}&date=${row.recordDate}`}
                className="min-w-[120px] text-sm-plus font-semibold text-ink hover:text-violet-deep"
              >
                {row.dateLabel}
              </Link>
              <span className="min-w-[92px] text-sm text-ink-2">
                {row.deaths} deaths
              </span>
              <span className="min-w-[110px] text-sm text-ink-2">
                {row.closingBirds.toLocaleString("en-US")} birds
              </span>
              <span className="min-w-[90px] text-sm text-ink-2">
                {row.feedKg ? `${row.feedKg} kg feed` : "—"}
              </span>
              <span className="flex-1" />
              <Badge tone={row.status === "submitted" ? "success" : "neutral"}>
                {row.status === "submitted" ? "Submitted" : "Draft"}
              </Badge>
              <ConfirmAction
                trigger={{
                  label: `Delete the record for ${row.dateLabel}`,
                  icon: "trash",
                  variant: "danger-icon",
                }}
                title="Delete daily record"
                message={`The record for ${row.dateLabel} will be removed. The flock's bird count is not rolled back.`}
                action={deleteDailyRecord}
                fields={{ id: row.id }}
                confirmLabel="Delete record"
                pendingLabel="Deleting…"
              />
            </div>
          ))
        )}
      </Card>
    </>
  );
}

function EntrySection({
  icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3.5 p-4">
      <div className="flex items-center gap-2.5">
        <IconChip icon={icon} size={32} />
        <div className="flex min-w-0 flex-col">
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          <span className="text-xs-plus text-ink-3">{hint}</span>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Note({
  tone,
  icon: Icon,
  children,
}: {
  tone: "warning" | "neutral";
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-nav px-3 py-2.5 ${
        tone === "warning" ? "bg-warning-bg" : "bg-bg"
      }`}
    >
      <Icon
        className={`size-4 shrink-0 ${tone === "warning" ? "text-warning" : "text-ink-3"}`}
      />
      <span
        className={`text-sm ${tone === "warning" ? "font-medium text-warning" : "text-ink-2"}`}
      >
        {children}
      </span>
    </div>
  );
}
