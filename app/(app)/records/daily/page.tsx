import {
  Barcode,
  Bird,
  Calendar,
  Check,
  ChevronDown,
  CircleCheckBig,
  CloudCheck,
  Egg,
  Fan,
  Hash,
  History,
  Info,
  Layers,
  NotebookPen,
  Package,
  Paperclip,
  Scale,
  Thermometer,
  TriangleAlert,
  UserRound,
  Warehouse,
  Wheat,
  type LucideIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconChip } from "@/components/ui/icon-chip";
import { Input } from "@/components/ui/input";

export default function DailyRecordsPage() {
  return (
    <>
      <PageHeader
        title="Daily Farm Records"
        breadcrumb={["Operations", "Daily Records"]}
        subtitle="Log today's house-level operations. Takes about 2 minutes."
      >
        <Button variant="secondary" icon={History}>
          View History
        </Button>
        <Button icon={Check}>Save Daily Record</Button>
      </PageHeader>

      <Card className="flex flex-wrap items-end gap-4 p-4">
        <ContextField icon={Calendar} label="Date" value="09 August 2026" />
        <ContextField icon={Warehouse} label="House" value="House 01" />
        <ContextField icon={Layers} label="Flock" value="JF-2026-001" />
        <div className="flex-1" />
        <span className="flex items-center gap-1.5 rounded-nav bg-violet-50 px-3 py-2 text-xs-plus font-medium text-violet-deep">
          <CloudCheck className="size-4" />
          Draft saved 2 min ago
        </span>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <EntrySection
          icon={Bird}
          title="Birds"
          hint="Opening balance is carried from yesterday"
        >
          <FieldRow>
            <Input
              label="Starting birds"
              icon={Hash}
              defaultValue="4,827"
              readOnly
              className="flex-1"
            />
            <Input
              label="Deaths"
              icon={Hash}
              defaultValue="7"
              className="flex-1"
            />
          </FieldRow>
          <FieldRow>
            <Input
              label="Culls"
              icon={Hash}
              defaultValue="0"
              className="flex-1"
            />
            <Input
              label="Transfers out"
              icon={Hash}
              defaultValue="0"
              className="flex-1"
            />
          </FieldRow>
          <div className="flex items-center gap-3 rounded-nav bg-violet-50 px-3 py-2.5">
            <span className="flex-1 text-sm-plus font-medium text-violet-deep">
              Closing birds
            </span>
            <span className="text-lg font-semibold text-violet-deep">
              4,820
            </span>
          </div>
        </EntrySection>

        <EntrySection
          icon={Wheat}
          title="Feed & Water"
          hint="Feed is deducted from inventory on save"
        >
          <FieldRow>
            <Input
              label="Feed consumed"
              icon={Hash}
              unit="kg"
              defaultValue="620"
              className="flex-1"
            />
            <Input
              label="Feed type"
              icon={Package}
              defaultValue="Broiler finisher"
              className="flex-1"
            />
          </FieldRow>
          <FieldRow>
            <Input
              label="Water consumption"
              icon={Hash}
              unit="L"
              defaultValue="980"
              className="flex-1"
            />
            <Input
              label="Feed batch"
              icon={Barcode}
              defaultValue="FB-1182"
              className="flex-1"
            />
          </FieldRow>
          <Note tone="warning" icon={TriangleAlert}>
            Finisher stock drops to 3.1 tons after this entry
          </Note>
        </EntrySection>

        <EntrySection
          icon={Thermometer}
          title="Environment"
          hint="Recorded at 08:00 and 14:00"
        >
          <FieldRow>
            <Input
              label="Temperature (min)"
              icon={Hash}
              unit="°C"
              defaultValue="24"
              className="flex-1"
            />
            <Input
              label="Temperature (max)"
              icon={Hash}
              unit="°C"
              defaultValue="33"
              className="flex-1"
            />
          </FieldRow>
          <FieldRow>
            <Input
              label="Humidity"
              icon={Hash}
              unit="%"
              defaultValue="68"
              className="flex-1"
            />
            <Input
              label="Ventilation setting"
              icon={Fan}
              defaultValue="Level 3"
              className="flex-1"
            />
          </FieldRow>
        </EntrySection>

        <EntrySection
          icon={Egg}
          title="Production"
          hint="Layer houses only · auto-hidden for broilers"
        >
          <FieldRow>
            <Input
              label="Eggs collected"
              icon={Hash}
              defaultValue="—"
              readOnly
              className="flex-1"
            />
            <Input
              label="Broken eggs"
              icon={Hash}
              defaultValue="—"
              readOnly
              className="flex-1"
            />
          </FieldRow>
          <Note tone="neutral" icon={Info}>
            House 01 holds a broiler flock — egg fields are disabled.
          </Note>
        </EntrySection>

        <EntrySection
          icon={Scale}
          title="Weight Sampling"
          hint="Sample at least 30 birds for a valid average"
        >
          <FieldRow>
            <Input
              label="Average weight"
              icon={Hash}
              unit="kg"
              defaultValue="1.45"
              className="flex-1"
            />
            <Input
              label="Sample size"
              icon={Hash}
              unit="birds"
              defaultValue="50"
              className="flex-1"
            />
          </FieldRow>
          <FieldRow>
            <Input
              label="Uniformity"
              icon={Hash}
              unit="%"
              defaultValue="88"
              className="flex-1"
            />
            <Input
              label="Recorded by"
              icon={UserRound}
              defaultValue="Amina Okoro"
              className="flex-1"
            />
          </FieldRow>
        </EntrySection>

        <EntrySection
          icon={NotebookPen}
          title="Notes & Evidence"
          hint="Optional context for the supervisor"
        >
          <textarea
            rows={4}
            defaultValue="Two mortalities linked to heat stress around 14:00. Ventilation raised to level 3 and extra water lines opened."
            className="w-full resize-none rounded-nav border border-border-hair bg-card p-3 text-base leading-[1.5] text-ink-2 outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-nav border border-border-hair bg-card px-3 py-2 text-sm-plus font-medium text-ink hover:bg-border-soft"
            >
              <Paperclip className="size-3.5 text-ink-2" />
              Attach photo
            </button>
            <span className="text-xs-plus text-ink-3">2 photos attached</span>
          </div>
        </EntrySection>
      </div>

      <Card className="flex flex-wrap items-center gap-3 p-4">
        <span className="flex flex-1 items-center gap-2 text-sm-plus text-ink-2">
          <CircleCheckBig className="size-4 text-success" />
          All required fields complete · record will sync to Flock JF-2026-001
        </span>
        <Button variant="secondary">Cancel</Button>
        <Button variant="secondary">Save as draft</Button>
        <Button icon={Check}>Save Daily Record</Button>
      </Card>
    </>
  );
}

function ContextField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-[180px] flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-2">{label}</span>
      <button
        type="button"
        className="flex h-10 items-center gap-2 rounded-nav border border-border-hair bg-card px-3"
      >
        <Icon className="size-4 text-ink-2" />
        <span className="flex-1 text-left text-base-plus font-medium text-ink">
          {value}
        </span>
        <ChevronDown className="size-4 text-ink-3" />
      </button>
    </div>
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

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-3">{children}</div>;
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
