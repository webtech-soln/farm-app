import {
  DateField,
  FormGrid,
  FullWidth,
  HiddenField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
  TimeField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { saveEggCollection, deleteEggCollection } from "@/lib/actions/eggs";
import {
  deleteMortalityRecord,
  deleteWeightRecord,
  saveMortalityRecord,
  saveWeightRecord,
  setMortalityStatus,
} from "@/lib/actions/records";
import { todayIso } from "@/lib/date";

export type FlockOption = {
  id: number;
  code: string;
  breed: string;
  houseId: number | null;
};
export type HouseOption = { id: number; code: string; name: string };

const today = todayIso;

const flockOptions = (flocks: FlockOption[]) =>
  flocks.map((flock) => ({
    value: flock.id,
    label: `${flock.code} · ${flock.breed}`,
  }));

const houseOptions = (houses: HouseOption[]) =>
  houses.map((house) => ({ value: house.id, label: house.name }));

/* -------------------------------------------------------------------------- */
/* Mortality                                                                  */
/* -------------------------------------------------------------------------- */

const MORTALITY_STATUS = [
  { value: "pending", label: "Pending review" },
  { value: "reviewed", label: "Reviewed" },
  { value: "under_treatment", label: "Under treatment" },
  { value: "escalated", label: "Escalated" },
];

export function MortalityFormDialog({
  flocks,
  houses,
}: {
  flocks: FlockOption[];
  houses: HouseOption[];
}) {
  return (
    <FormDialog
      capability="records:write"
      trigger={{ label: "Record Mortality", icon: "plus" }}
      title="Record mortality"
      description="Log losses as they are found. The daily record still reconciles the bird count."
      action={saveMortalityRecord}
      submitLabel="Log mortality"
    >
      <FormGrid>
        <SelectField
          name="flockId"
          label="Flock"
          required
          options={flockOptions(flocks)}
          placeholder="Choose a flock…"
        />
        <SelectField
          name="houseId"
          label="House"
          options={houseOptions(houses)}
          placeholder="Unassigned"
        />
        <DateField
          name="occurredOn"
          label="Date found"
          required
          defaultValue={today()}
        />
        <TimeField name="occurredAt" label="Time" />
        <NumberField name="deaths" label="Deaths" required min={1} unit="birds" />
        <TextField
          name="cause"
          label="Cause"
          required
          placeholder="Heat stress"
        />
        <SelectField
          name="status"
          label="Status"
          options={MORTALITY_STATUS}
          defaultValue="pending"
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            placeholder="Where the birds were found, actions taken…"
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

/** The row menu on the mortality register: move a case along its review path. */
export function MortalityStatusDialog({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  return (
    <FormDialog
      capability="records:write"
      trigger={{ label: "Change status", icon: "check-big", variant: "icon" }}
      title="Update review status"
      size="sm"
      action={setMortalityStatus}
      submitLabel="Update status"
    >
      <HiddenField name="id" value={id} />
      <SelectField
        name="status"
        label="Status"
        required
        options={MORTALITY_STATUS}
        defaultValue={status}
      />
    </FormDialog>
  );
}

export function DeleteMortalityDialog({ id }: { id: number }) {
  return (
    <ConfirmAction
      capability="records:write"
      trigger={{ label: "Delete record", icon: "trash", variant: "danger-icon" }}
      title="Delete mortality record"
      message="The entry is removed from the register. Bird counts already reconciled through daily records are not changed."
      action={deleteMortalityRecord}
      fields={{ id }}
      confirmLabel="Delete record"
      pendingLabel="Deleting…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Weight sampling                                                            */
/* -------------------------------------------------------------------------- */

export function WeightFormDialog({
  flocks,
  houses,
}: {
  flocks: FlockOption[];
  houses: HouseOption[];
}) {
  return (
    <FormDialog
      capability="records:write"
      trigger={{ label: "Record Weights", icon: "plus" }}
      title="Record a weight sample"
      description="Sample at least 30 birds so the average is representative."
      action={saveWeightRecord}
      submitLabel="Save sample"
    >
      <FormGrid>
        <SelectField
          name="flockId"
          label="Flock"
          required
          options={flockOptions(flocks)}
          placeholder="Choose a flock…"
        />
        <SelectField
          name="houseId"
          label="House"
          options={houseOptions(houses)}
          placeholder="Unassigned"
        />
        <DateField
          name="recordedOn"
          label="Sampled on"
          required
          defaultValue={today()}
        />
        <NumberField name="ageDays" label="Age" min={0} unit="days" />
        <NumberField
          name="avgWeightKg"
          label="Average weight"
          required
          min={0.01}
          step={0.01}
          unit="kg"
        />
        <NumberField
          name="standardWeightKg"
          label="Breed standard"
          min={0}
          step={0.01}
          unit="kg"
        />
        <NumberField
          name="sampleSize"
          label="Sample size"
          required
          min={30}
          unit="birds"
          hint="Minimum 30 birds."
        />
        <NumberField
          name="uniformityPct"
          label="Uniformity"
          min={0}
          max={100}
          step={0.1}
          unit="%"
        />
      </FormGrid>
    </FormDialog>
  );
}

export function DeleteWeightDialog({ id }: { id: number }) {
  return (
    <ConfirmAction
      capability="records:write"
      trigger={{ label: "Delete sample", icon: "trash", variant: "danger-icon" }}
      title="Delete weight sample"
      message="The sample is removed from the growth curve."
      action={deleteWeightRecord}
      fields={{ id }}
      confirmLabel="Delete sample"
      pendingLabel="Deleting…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Egg collections                                                            */
/* -------------------------------------------------------------------------- */

const SESSIONS = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "evening", label: "Evening" },
];

export function EggCollectionDialog({
  houses,
  flocks,
}: {
  houses: HouseOption[];
  flocks: FlockOption[];
}) {
  return (
    <FormDialog
      capability="records:write"
      trigger={{ label: "Record Eggs", icon: "plus" }}
      title="Record a collection"
      description="Grades and sizes are optional, but they must add up to the collection."
      size="lg"
      action={saveEggCollection}
      submitLabel="Record collection"
    >
      <FormGrid>
        <SelectField
          name="houseId"
          label="House"
          required
          options={houseOptions(houses)}
          placeholder="Choose a house…"
        />
        <SelectField
          name="flockId"
          label="Flock"
          options={flockOptions(flocks)}
          placeholder="Unassigned"
        />
        <DateField
          name="collectedOn"
          label="Collected on"
          required
          defaultValue={today()}
        />
        <TimeField
          name="collectedAt"
          label="Collected at"
          required
          defaultValue="07:00"
        />
        <SelectField
          name="session"
          label="Session"
          required
          options={SESSIONS}
          defaultValue="morning"
        />
        <NumberField
          name="collected"
          label="Eggs collected"
          required
          min={0}
          unit="eggs"
        />
        <NumberField name="broken" label="Broken" min={0} defaultValue={0} />
        <NumberField name="gradeA" label="Grade A" min={0} defaultValue={0} />
        <NumberField name="gradeB" label="Grade B" min={0} defaultValue={0} />
        <NumberField name="rejected" label="Rejected" min={0} defaultValue={0} />
        <NumberField name="sizeSmall" label="Small" min={0} defaultValue={0} />
        <NumberField name="sizeMedium" label="Medium" min={0} defaultValue={0} />
        <NumberField name="sizeLarge" label="Large" min={0} defaultValue={0} />
        <NumberField
          name="sizeExtraLarge"
          label="Extra large"
          min={0}
          defaultValue={0}
        />
      </FormGrid>
    </FormDialog>
  );
}

export function DeleteEggCollectionDialog({ id }: { id: number }) {
  return (
    <ConfirmAction
      capability="records:write"
      trigger={{ label: "Delete collection", icon: "trash", variant: "danger-icon" }}
      title="Delete collection"
      message="The collection is removed from today's production totals."
      action={deleteEggCollection}
      fields={{ id }}
      confirmLabel="Delete collection"
      pendingLabel="Deleting…"
    />
  );
}
