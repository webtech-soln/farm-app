import {
  DateField,
  FormGrid,
  FullWidth,
  HiddenField,
  SelectField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { deleteReport, requestReport } from "@/lib/actions/reports";

const FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
];

export type ReportOption = { key: string; name: string };

/**
 * Queues a run of one of the catalogue reports. The row lands on the register
 * as "Queued" until a generator produces the file.
 */
export function ReportRequestDialog({
  reports,
  reportKey,
  name,
  label,
  format,
  variant = "primary",
}: {
  reports?: ReportOption[];
  /** Set when the dialog is opened from a specific catalogue card. */
  reportKey?: string;
  name?: string;
  label?: string;
  /** Preselected output format, used by the per-card format chips. */
  format?: string;
  variant?: "primary" | "secondary" | "icon" | "chip";
}) {
  const fixed = Boolean(reportKey);

  return (
    <FormDialog
      capability="farm:write"
      trigger={{
        label: label ?? (fixed ? `Generate ${name}` : "Custom Report"),
        icon: fixed ? "clock" : "plus",
        variant,
      }}
      title={fixed ? `Generate ${name}` : "Queue a report"}
      description="Reports run in the background; the register shows when the file is ready."
      action={requestReport}
      submitLabel="Queue report"
    >
      {fixed ? <HiddenField name="reportKey" value={reportKey} /> : null}
      <FormGrid>
        {fixed ? null : (
          <SelectField
            name="reportKey"
            label="Report"
            required
            options={(reports ?? []).map((report) => ({
              value: report.key,
              label: report.name,
            }))}
            placeholder="Choose a report…"
          />
        )}
        <TextField
          name="name"
          label="Report name"
          required
          placeholder={name ?? "Monthly farm performance"}
          defaultValue={name ?? ""}
        />
        <SelectField
          name="format"
          label="Format"
          required
          options={FORMATS}
          defaultValue={format ?? "pdf"}
        />
        <DateField name="periodStart" label="Period from" />
        <DateField name="periodEnd" label="Period to" />
        <FullWidth>
          <TextField
            name="periodLabel"
            label="Period label"
            placeholder="August 2026"
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function DeleteReportDialog({ id, name }: { id: number; name: string }) {
  return (
    <ConfirmAction
      capability="farm:write"
      trigger={{ label: `Delete ${name}`, icon: "trash", variant: "danger-icon" }}
      title="Delete report"
      message={`${name} is removed from the register along with its generated file.`}
      action={deleteReport}
      fields={{ id }}
      confirmLabel="Delete report"
      pendingLabel="Deleting…"
    />
  );
}
