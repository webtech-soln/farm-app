import {
  DateField,
  FormGrid,
  FullWidth,
  HiddenField,
  MoneyField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import {
  deleteExpense,
  saveExpense,
  setExpenseStatus,
} from "@/lib/actions/finance";
import { todayIso } from "@/lib/date";

const today = todayIso;
const dollars = (cents: number | undefined | null) =>
  cents === undefined || cents === null ? "" : (cents / 100).toFixed(2);

export type SupplierOption = { id: number; name: string };

export type ExpenseValues = {
  id: number;
  expenseDate: string;
  description: string;
  category: string;
  amountCents: number;
  supplierId: number | null;
  method: string;
  status: string;
  notes: string | null;
};

const CATEGORIES = [
  { value: "feed", label: "Feed" },
  { value: "labour", label: "Labour" },
  { value: "medicine", label: "Medicine & vet" },
  { value: "utilities", label: "Utilities" },
  { value: "transport", label: "Transport" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
];

const METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "cheque", label: "Cheque" },
  { value: "part_cash", label: "Part cash" },
];

const STATUSES = [
  { value: "pending", label: "Pending approval" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export function ExpenseDialog({
  suppliers,
  expense,
  label,
}: {
  suppliers: SupplierOption[];
  expense?: ExpenseValues;
  label?: string;
}) {
  const editing = Boolean(expense);

  return (
    <FormDialog
      capability="finance:write"
      trigger={
        editing
          ? { label: `Edit ${expense!.description}`, icon: "pencil", variant: "icon" }
          : { label: label ?? "Add Expense", icon: "plus" }
      }
      title={editing ? "Edit expense" : "Add an expense"}
      action={saveExpense}
      submitLabel={editing ? "Save changes" : "Add expense"}
      size="lg"
    >
      <HiddenField name="id" value={expense?.id} />
      <FormGrid>
        <DateField
          name="expenseDate"
          label="Date"
          required
          defaultValue={expense?.expenseDate ?? today()}
        />
        <SelectField
          name="category"
          label="Category"
          required
          options={CATEGORIES}
          placeholder="Choose a category…"
          defaultValue={expense?.category}
        />
        <FullWidth>
          <TextField
            name="description"
            label="Description"
            required
            placeholder="Broiler finisher — 12 tons"
            defaultValue={expense?.description}
          />
        </FullWidth>
        <MoneyField
          name="amountCents"
          label="Amount"
          required
          defaultValue={dollars(expense?.amountCents)}
        />
        <SelectField
          name="supplierId"
          label="Supplier"
          options={suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
          }))}
          placeholder="Not linked"
          defaultValue={expense?.supplierId ?? ""}
        />
        <SelectField
          name="method"
          label="Payment method"
          options={METHODS}
          defaultValue={expense?.method ?? "bank_transfer"}
        />
        <SelectField
          name="status"
          label="Approval status"
          options={STATUSES}
          defaultValue={expense?.status ?? "pending"}
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            defaultValue={expense?.notes ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function ExpenseStatusDialog({
  id,
  status,
}: {
  id: number;
  status: string;
}) {
  return (
    <FormDialog
      capability="finance:write"
      trigger={{ label: "Change approval", icon: "check-big", variant: "icon" }}
      title="Update approval"
      size="sm"
      action={setExpenseStatus}
      submitLabel="Update status"
    >
      <HiddenField name="id" value={id} />
      <SelectField
        name="status"
        label="Approval status"
        required
        options={STATUSES}
        defaultValue={status}
      />
    </FormDialog>
  );
}

export function DeleteExpenseDialog({
  id,
  description,
}: {
  id: number;
  description: string;
}) {
  return (
    <ConfirmAction
      capability="finance:write"
      trigger={{ label: `Delete ${description}`, icon: "trash", variant: "danger-icon" }}
      title="Delete expense"
      message="The expense is removed from the ledger and from every profitability figure."
      action={deleteExpense}
      fields={{ id }}
      confirmLabel="Delete expense"
      pendingLabel="Deleting…"
    />
  );
}
