import {
  FormGrid,
  FullWidth,
  HiddenField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { deleteHouse, saveHouse } from "@/lib/actions/houses";

const STATUS_OPTIONS = [
  { value: "healthy", label: "Healthy" },
  { value: "warning", label: "Needs attention" },
  { value: "brooding", label: "Brooding" },
  { value: "maintenance", label: "Maintenance" },
  { value: "empty", label: "Empty" },
];

export type HouseFormValues = {
  dbId: number;
  code: string;
  name: string;
  capacity: number;
  statusKey: string;
  notes: string | null;
};

/** `Add House` in the board header, and the pencil on each house card. */
export function HouseFormDialog({
  house,
  labelled = false,
}: {
  house?: HouseFormValues;
  /** Renders a full "Edit House" button instead of the row pencil. */
  labelled?: boolean;
}) {
  const editing = Boolean(house);

  return (
    <FormDialog
      capability="farm:write"
      trigger={
        !editing
          ? { label: "Add House", icon: "plus" }
          : labelled
            ? { label: "Edit House", icon: "pencil", variant: "secondary" }
            : { label: `Edit ${house!.name}`, icon: "pencil", variant: "icon" }
      }
      title={editing ? `Edit ${house!.name}` : "Add house"}
      description={
        editing
          ? "Update the shed's details. The code is used across every record."
          : "Register a new shed so flocks and daily records can be filed against it."
      }
      action={saveHouse}
      submitLabel={editing ? "Save changes" : "Add house"}
    >
      <HiddenField name="id" value={house?.dbId} />
      <FormGrid>
        <TextField
          name="code"
          label="House code"
          required
          placeholder="house-07"
          hint="Letters, numbers and hyphens."
          defaultValue={house?.code}
        />
        <TextField
          name="name"
          label="House name"
          required
          placeholder="House 07"
          defaultValue={house?.name}
        />
        <NumberField
          name="capacity"
          label="Capacity"
          required
          min={1}
          unit="birds"
          defaultValue={house?.capacity}
        />
        <SelectField
          name="status"
          label="Status"
          required
          options={STATUS_OPTIONS}
          placeholder="Choose a status…"
          defaultValue={house?.statusKey ?? "empty"}
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            placeholder="Ventilation upgrade due, litter changed weekly…"
            defaultValue={house?.notes ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function DeleteHouseDialog({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  return (
    <ConfirmAction
      capability="farm:write"
      trigger={{ label: `Delete ${name}`, icon: "trash", variant: "danger-icon" }}
      title="Delete house"
      message={`${name} and its readings will be removed. A house that still holds a flock cannot be deleted.`}
      action={deleteHouse}
      fields={{ id }}
      confirmLabel="Delete house"
      pendingLabel="Deleting…"
    />
  );
}
