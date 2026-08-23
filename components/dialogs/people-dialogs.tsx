import {
  CheckboxField,
  DateField,
  DateTimeField,
  FormGrid,
  FullWidth,
  HiddenField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { deactivateUser, saveUser } from "@/lib/actions/people";
import { deleteTask, saveTask, setTaskStatus } from "@/lib/actions/tasks";

export type PersonOption = { id: number; name: string };

export type UserFormValues = {
  id: number;
  name: string;
  email: string;
  role: string;
  jobTitle: string | null;
  phone: string | null;
  assignedArea: string | null;
  dutyStatus: string;
  joinedOn: string | null;
  attendancePct: number | null;
  isContractor: boolean;
  isActive: boolean;
};

const ROLES = [
  { value: "owner", label: "Farm Owner" },
  { value: "manager", label: "Farm Manager" },
  { value: "supervisor", label: "Farm Supervisor" },
  { value: "attendant", label: "Poultry Attendant" },
  { value: "vet", label: "Veterinarian" },
  { value: "sales", label: "Sales Officer" },
  { value: "driver", label: "Driver" },
];

const DUTY_STATUS = [
  { value: "on_duty", label: "On duty" },
  { value: "visiting", label: "Visiting" },
  { value: "on_road", label: "On the road" },
  { value: "on_leave", label: "On leave" },
  { value: "off_duty", label: "Off duty" },
];

/* -------------------------------------------------------------------------- */
/* People                                                                     */
/* -------------------------------------------------------------------------- */

export function EmployeeDialog({ person }: { person?: UserFormValues }) {
  const editing = Boolean(person);

  return (
    <FormDialog
      capability="people:write"
      trigger={
        editing
          ? { label: `Edit ${person!.name}`, icon: "pencil", variant: "icon" }
          : { label: "Add Employee", icon: "plus" }
      }
      title={editing ? `Edit ${person!.name}` : "Add a team member"}
      description={
        editing
          ? "Roles decide which boards the person can change."
          : "A new account needs a password before it can sign in."
      }
      action={saveUser}
      submitLabel={editing ? "Save changes" : "Add person"}
      size="lg"
    >
      <HiddenField name="id" value={person?.id} />
      <FormGrid>
        <TextField
          name="name"
          label="Full name"
          required
          placeholder="Amina Okoro"
          defaultValue={person?.name}
        />
        <TextField
          name="email"
          label="Work email"
          type="email"
          required
          placeholder="amina@jaydafarms.com"
          defaultValue={person?.email}
        />
        <SelectField
          name="role"
          label="Role"
          required
          options={ROLES}
          placeholder="Choose a role…"
          defaultValue={person?.role}
        />
        <TextField
          name="jobTitle"
          label="Job title"
          placeholder="Farm Supervisor"
          defaultValue={person?.jobTitle ?? ""}
        />
        <TextField
          name="phone"
          label="Phone"
          placeholder="+234 802 000 0000"
          defaultValue={person?.phone ?? ""}
        />
        <TextField
          name="assignedArea"
          label="Assigned area"
          placeholder="Houses 01–03"
          defaultValue={person?.assignedArea ?? ""}
        />
        <SelectField
          name="dutyStatus"
          label="Duty status"
          options={DUTY_STATUS}
          defaultValue={person?.dutyStatus ?? "on_duty"}
        />
        <DateField
          name="joinedOn"
          label="Joined on"
          defaultValue={person?.joinedOn ?? ""}
        />
        <NumberField
          name="attendancePct"
          label="Attendance"
          min={0}
          max={100}
          step={0.1}
          unit="%"
          defaultValue={person?.attendancePct ?? ""}
        />
        <TextField
          name="password"
          label={editing ? "New password" : "Initial password"}
          type="password"
          required={!editing}
          hint={
            editing
              ? "Leave blank to keep the current password."
              : "At least 10 characters."
          }
          autoComplete="new-password"
        />
        <CheckboxField
          name="isContractor"
          label="Contractor"
          defaultChecked={person?.isContractor ?? false}
        />
        <CheckboxField
          name="isActive"
          label="Active account"
          hint="Inactive accounts are signed out immediately."
          defaultChecked={person?.isActive ?? true}
        />
      </FormGrid>
    </FormDialog>
  );
}

export function DeactivateUserDialog({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  return (
    <ConfirmAction
      capability="people:write"
      trigger={{ label: `Deactivate ${name}`, icon: "ban", variant: "danger-icon" }}
      title="Deactivate account"
      message={`${name} is signed out and can no longer sign in. Their name stays on every record they touched.`}
      action={deactivateUser}
      fields={{ id }}
      confirmLabel="Deactivate"
      pendingLabel="Deactivating…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Tasks                                                                      */
/* -------------------------------------------------------------------------- */

export type TaskFormValues = {
  id: number;
  title: string;
  detail: string | null;
  priority: string;
  status: string;
  contextLabel: string | null;
  assigneeId: number | null;
  dueAt: string | null;
};

const PRIORITIES = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const TASK_STATUS = [
  { value: "pending", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function TaskDialog({
  people,
  task,
  status,
}: {
  people: PersonOption[];
  task?: TaskFormValues;
  /** Preselects the column a card is added from. */
  status?: string;
}) {
  const editing = Boolean(task);

  return (
    <FormDialog
      capability="tasks:write"
      trigger={
        editing
          ? { label: `Edit ${task!.title}`, icon: "pencil", variant: "icon" }
          : status
            ? { label: "Add a task here", icon: "plus", variant: "icon" }
            : { label: "Add Task", icon: "plus" }
      }
      title={editing ? "Edit task" : "Add a task"}
      action={saveTask}
      submitLabel={editing ? "Save changes" : "Create task"}
    >
      <HiddenField name="id" value={task?.id} />
      <FormGrid>
        <FullWidth>
          <TextField
            name="title"
            label="Task"
            required
            placeholder="Vaccinate House 04 (Gumboro)"
            defaultValue={task?.title}
          />
        </FullWidth>
        <SelectField
          name="priority"
          label="Priority"
          required
          options={PRIORITIES}
          placeholder="Choose a priority…"
          defaultValue={task?.priority ?? "medium"}
        />
        <SelectField
          name="status"
          label="Status"
          options={TASK_STATUS}
          defaultValue={task?.status ?? status ?? "pending"}
        />
        <SelectField
          name="assigneeId"
          label="Assignee"
          options={people.map((person) => ({
            value: person.id,
            label: person.name,
          }))}
          placeholder="Unassigned"
          defaultValue={task?.assigneeId ?? ""}
        />
        <TextField
          name="contextLabel"
          label="Context"
          placeholder="House 04"
          defaultValue={task?.contextLabel ?? ""}
        />
        <FullWidth>
          <DateTimeField
            name="dueAt"
            label="Due"
            defaultValue={task?.dueAt ?? ""}
          />
        </FullWidth>
        <FullWidth>
          <TextAreaField
            name="detail"
            label="Detail"
            rows={2}
            defaultValue={task?.detail ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function TaskStatusDialog({
  id,
  title,
  status,
}: {
  id: number;
  title: string;
  status: string;
}) {
  return (
    <FormDialog
      capability="tasks:write"
      trigger={{ label: `Move ${title}`, icon: "check-big", variant: "icon" }}
      title="Move task"
      size="sm"
      action={setTaskStatus}
      submitLabel="Move task"
    >
      <HiddenField name="id" value={id} />
      <SelectField
        name="status"
        label="Status"
        required
        options={TASK_STATUS}
        defaultValue={status}
      />
    </FormDialog>
  );
}

export function DeleteTaskDialog({ id, title }: { id: number; title: string }) {
  return (
    <ConfirmAction
      capability="tasks:write"
      trigger={{ label: `Delete ${title}`, icon: "trash", variant: "danger-icon" }}
      title="Delete task"
      message="The task is removed from the board and from the dashboard's task list."
      action={deleteTask}
      fields={{ id }}
      confirmLabel="Delete task"
      pendingLabel="Deleting…"
    />
  );
}
