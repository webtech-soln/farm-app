import {
  DateField,
  DateTimeField,
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
import {
  cancelVaccination,
  completeVaccination,
  deleteHealthEvent,
  resolveHealthEvent,
  saveHealthEvent,
  saveVaccination,
} from "@/lib/actions/health";
import { nowDateTimeLocal, todayIso } from "@/lib/date";

export type FlockOption = { id: number; code: string; breed: string };
export type HouseOption = { id: number; code: string; name: string };
export type PersonOption = { id: number; name: string };

const today = todayIso;

const HEALTH_STATUS = [
  { value: "monitoring", label: "Monitoring" },
  { value: "in_treatment", label: "In treatment" },
  { value: "escalated", label: "Escalated" },
  { value: "resolved", label: "Resolved" },
];

/* -------------------------------------------------------------------------- */
/* Health cases                                                               */
/* -------------------------------------------------------------------------- */

export function HealthEventDialog({
  flocks,
  houses,
}: {
  flocks: FlockOption[];
  houses: HouseOption[];
}) {
  return (
    <FormDialog
      capability="health:write"
      trigger={{ label: "Log Health Event", icon: "plus" }}
      title="Log a health case"
      description="Raise a case as soon as symptoms are seen so treatment can be tracked."
      action={saveHealthEvent}
      submitLabel="Log case"
      size="lg"
    >
      <FormGrid>
        <SelectField
          name="flockId"
          label="Flock"
          required
          options={flocks.map((flock) => ({
            value: flock.id,
            label: `${flock.code} · ${flock.breed}`,
          }))}
          placeholder="Choose a flock…"
        />
        <SelectField
          name="houseId"
          label="House"
          options={houses.map((house) => ({
            value: house.id,
            label: house.name,
          }))}
          placeholder="Unassigned"
        />
        <DateField
          name="occurredOn"
          label="Observed on"
          required
          defaultValue={today()}
        />
        <TextField
          name="condition"
          label="Condition"
          required
          placeholder="Coccidiosis"
        />
        <NumberField
          name="cases"
          label="Birds affected"
          required
          min={1}
          unit="birds"
        />
        <TextField
          name="treatment"
          label="Treatment"
          placeholder="Amprolium in water, 5 days"
        />
        <SelectField
          name="status"
          label="Status"
          options={HEALTH_STATUS}
          defaultValue="monitoring"
        />
        <DateField name="resolvedOn" label="Resolved on" />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            placeholder="Symptoms, vet instructions, follow-up…"
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function ResolveHealthEventDialog({
  id,
  condition,
}: {
  id: number;
  condition: string;
}) {
  return (
    <FormDialog
      capability="health:write"
      trigger={{ label: `Resolve ${condition}`, icon: "check-big", variant: "icon" }}
      title="Resolve case"
      description="Closes the case and stamps the resolution date."
      size="sm"
      action={resolveHealthEvent}
      submitLabel="Resolve case"
    >
      <HiddenField name="id" value={id} />
      <DateField
        name="resolvedOn"
        label="Resolved on"
        required
        defaultValue={today()}
      />
      <TextAreaField
        name="notes"
        label="Closing note"
        placeholder="Outcome, remaining follow-up…"
      />
    </FormDialog>
  );
}

export function DeleteHealthEventDialog({ id }: { id: number }) {
  return (
    <ConfirmAction
      capability="health:write"
      trigger={{ label: "Delete case", icon: "trash", variant: "danger-icon" }}
      title="Delete health case"
      message="The case is removed from the register and from the health trend."
      action={deleteHealthEvent}
      fields={{ id }}
      confirmLabel="Delete case"
      pendingLabel="Deleting…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Vaccinations                                                               */
/* -------------------------------------------------------------------------- */

export function VaccinationDialog({
  flocks,
  houses,
  people,
}: {
  flocks: FlockOption[];
  houses: HouseOption[];
  people: PersonOption[];
}) {
  return (
    <FormDialog
      capability="health:write"
      trigger={{ label: "Schedule Vaccination", icon: "plus" }}
      title="Schedule a vaccination"
      description="Scheduled doses appear on the calendar and roll into the overdue count once the date passes."
      action={saveVaccination}
      submitLabel="Schedule dose"
      size="lg"
    >
      <FormGrid>
        <SelectField
          name="flockId"
          label="Flock"
          options={flocks.map((flock) => ({
            value: flock.id,
            label: `${flock.code} · ${flock.breed}`,
          }))}
          placeholder="Unassigned"
        />
        <SelectField
          name="houseId"
          label="House"
          options={houses.map((house) => ({
            value: house.id,
            label: house.name,
          }))}
          placeholder="Unassigned"
        />
        <TextField
          name="vaccine"
          label="Vaccine"
          required
          placeholder="Newcastle (Lasota)"
        />
        <TextField
          name="route"
          label="Route"
          required
          placeholder="Drinking water"
        />
        <DateField
          name="scheduledOn"
          label="Scheduled on"
          required
          defaultValue={today()}
        />
        <TimeField name="scheduledAt" label="Scheduled at" />
        <NumberField name="doses" label="Doses" required min={1} />
        <SelectField
          name="administeredById"
          label="Administered by"
          options={people.map((person) => ({
            value: person.id,
            label: person.name,
          }))}
          placeholder="Unassigned"
        />
        <FullWidth>
          <TextAreaField name="notes" label="Notes" />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function CompleteVaccinationDialog({
  id,
  vaccine,
  doses,
}: {
  id: number;
  vaccine: string;
  doses?: number;
}) {
  return (
    <FormDialog
      capability="health:write"
      trigger={{ label: `Mark ${vaccine} given`, icon: "check-big", variant: "icon" }}
      title="Mark dose as given"
      size="sm"
      action={completeVaccination}
      submitLabel="Mark as given"
    >
      <HiddenField name="id" value={id} />
      <DateTimeField
        name="administeredAt"
        label="Administered at"
        defaultValue={nowDateTimeLocal()}
      />
      <NumberField
        name="doses"
        label="Doses given"
        min={1}
        defaultValue={doses}
      />
      <TextAreaField name="notes" label="Notes" rows={2} />
    </FormDialog>
  );
}

export function CancelVaccinationDialog({
  id,
  vaccine,
}: {
  id: number;
  vaccine: string;
}) {
  return (
    <ConfirmAction
      capability="health:write"
      trigger={{ label: `Cancel ${vaccine}`, icon: "ban", variant: "danger-icon" }}
      title="Cancel vaccination"
      message={`The ${vaccine} dose stays on the register as cancelled, so the plan keeps its history.`}
      action={cancelVaccination}
      fields={{ id }}
      confirmLabel="Cancel dose"
      pendingLabel="Cancelling…"
    />
  );
}
