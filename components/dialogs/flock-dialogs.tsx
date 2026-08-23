import {
  DateField,
  FormGrid,
  FullWidth,
  HiddenField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { closeFlock, deleteFlock, saveFlock } from "@/lib/actions/flocks";
import type { FlockFormValues } from "@/lib/data/flocks";
import { todayIso } from "@/lib/date";

const STATUS_OPTIONS = [
  { value: "healthy", label: "Healthy" },
  { value: "warning", label: "Needs attention" },
  { value: "brooding", label: "Brooding" },
  { value: "treatment", label: "In treatment" },
  { value: "closed", label: "Closed" },
];

const TYPE_OPTIONS = [
  { value: "broiler", label: "Broiler" },
  { value: "layer", label: "Layer" },
];

export type HouseOption = { id: number; code: string; name: string };

const today = todayIso;

/** `Add Flock` in the board header, and the pencil on each register row. */
export function FlockFormDialog({
  houses,
  flock,
  labelled = false,
}: {
  houses: HouseOption[];
  flock?: FlockFormValues;
  /** Renders a full "Edit Flock" button instead of the row pencil. */
  labelled?: boolean;
}) {
  const editing = Boolean(flock);
  const houseOptions = houses.map((house) => ({
    value: house.id,
    label: house.name,
  }));

  return (
    <FormDialog
      capability="farm:write"
      trigger={
        !editing
          ? { label: "Add Flock", icon: "plus" }
          : labelled
            ? { label: "Edit Flock", icon: "pencil", variant: "secondary" }
            : { label: `Edit flock ${flock!.code}`, icon: "pencil", variant: "icon" }
      }
      title={editing ? `Edit flock ${flock!.code}` : "Place a flock"}
      description={
        editing
          ? "Update the placement. Mortality is recalculated from the live count."
          : "Record a new placement. Daily records and health events file against it."
      }
      size="lg"
      action={saveFlock}
      submitLabel={editing ? "Save changes" : "Place flock"}
    >
      <HiddenField name="id" value={flock?.dbId} />
      <FormGrid>
        <TextField
          name="code"
          label="Flock ID"
          required
          placeholder="JF-2026-009"
          defaultValue={flock?.code}
        />
        <SelectField
          name="houseId"
          label="House"
          options={houseOptions}
          placeholder="Unassigned"
          defaultValue={flock?.houseId ?? ""}
        />
        <SelectField
          name="type"
          label="Type"
          required
          options={TYPE_OPTIONS}
          placeholder="Choose a type…"
          defaultValue={flock?.type}
        />
        <TextField
          name="breed"
          label="Breed"
          required
          placeholder="Ross 308"
          defaultValue={flock?.breed}
        />
        <NumberField
          name="initialCount"
          label="Initial birds"
          required
          min={1}
          unit="birds"
          defaultValue={flock?.initialCount}
        />
        <NumberField
          name="currentCount"
          label="Current birds"
          required
          min={0}
          unit="birds"
          hint="Cannot exceed the placement."
          defaultValue={flock?.currentCount ?? flock?.initialCount}
        />
        <DateField
          name="startedOn"
          label="Placed on"
          required
          defaultValue={flock?.startedOn ?? today()}
        />
        <SelectField
          name="status"
          label="Status"
          required
          options={STATUS_OPTIONS}
          placeholder="Choose a status…"
          defaultValue={flock?.status ?? "brooding"}
        />
        <DateField
          name="closedOn"
          label="Closed on"
          hint="Required once the status is closed."
          defaultValue={flock?.closedOn ?? ""}
        />
        <TextField
          name="sourceHatchery"
          label="Source hatchery"
          placeholder="Zartech Hatchery"
          defaultValue={flock?.sourceHatchery ?? ""}
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            placeholder="Placement conditions, vaccination plan…"
            defaultValue={flock?.notes ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function CloseFlockDialog({ id, code }: { id: number; code: string }) {
  return (
    <ConfirmAction
      capability="farm:write"
      trigger={{ label: `Close flock ${code}`, icon: "ban", variant: "icon" }}
      title="Close flock"
      message={`Flock ${code} is kept with all of its history, but stops counting as live stock.`}
      action={closeFlock}
      fields={{ id }}
      confirmLabel="Close flock"
      pendingLabel="Closing…"
      tone="primary"
    >
      <DateField name="closedOn" label="Closed on" defaultValue={today()} />
    </ConfirmAction>
  );
}

export function DeleteFlockDialog({ id, code }: { id: number; code: string }) {
  return (
    <ConfirmAction
      capability="farm:write"
      trigger={{ label: `Delete flock ${code}`, icon: "trash", variant: "danger-icon" }}
      title="Delete flock"
      message={`Flock ${code} will be removed. A flock that already has daily records must be closed instead.`}
      action={deleteFlock}
      fields={{ id }}
      confirmLabel="Delete flock"
      pendingLabel="Deleting…"
    />
  );
}
