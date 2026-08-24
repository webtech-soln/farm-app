import {
  DateField,
  FormGrid,
  FullWidth,
  HiddenField,
  MoneyField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import {
  archiveInventoryItem,
  deleteSupplier,
  recordStockMovement,
  saveInventoryItem,
  saveSupplier,
} from "@/lib/actions/inventory";
import { todayIso } from "@/lib/date";

export type SupplierOption = { id: number; name: string };
export type ItemOption = { id: number; name: string; unit?: string };

export type InventoryItemValues = {
  id: number;
  sku: string;
  name: string;
  category: string;
  subcategory: string | null;
  quantity: number;
  unit: string;
  unitCostCents: number;
  minStock: number;
  batch: string | null;
  expiryDate: string | null;
  supplierId: number | null;
};

const CATEGORIES = [
  { value: "feed", label: "Feed" },
  { value: "medicine", label: "Medicine" },
  { value: "equipment", label: "Equipment" },
  { value: "packaging", label: "Packaging" },
  { value: "consumable", label: "Consumable" },
  { value: "other", label: "Other" },
];

const today = todayIso;
const cedis = (cents: number | undefined) =>
  cents === undefined ? "" : (cents / 100).toFixed(2);

/* -------------------------------------------------------------------------- */
/* Items                                                                      */
/* -------------------------------------------------------------------------- */

export function InventoryItemDialog({
  suppliers,
  item,
  category,
  label,
}: {
  suppliers: SupplierOption[];
  item?: InventoryItemValues;
  /** Preselects the category on the feed and medicine boards. */
  category?: string;
  label?: string;
}) {
  const editing = Boolean(item);

  return (
    <FormDialog
      capability="inventory:write"
      trigger={
        editing
          ? { label: `Edit ${item!.name}`, icon: "pencil", variant: "icon" }
          : { label: label ?? "Add Inventory", icon: "plus" }
      }
      title={editing ? `Edit ${item!.name}` : (label ?? "Add an item")}
      description={
        editing
          ? "Quantity changes belong in a stock movement so the ledger stays intact."
          : "Register the item, then record its opening stock as a movement."
      }
      size="lg"
      action={saveInventoryItem}
      submitLabel={editing ? "Save changes" : "Add item"}
    >
      <HiddenField name="id" value={item?.id} />
      <FormGrid>
        <TextField
          name="sku"
          label="SKU"
          required
          placeholder="FD-1182"
          defaultValue={item?.sku}
        />
        <TextField
          name="name"
          label="Item name"
          required
          placeholder="Broiler finisher"
          defaultValue={item?.name}
        />
        <SelectField
          name="category"
          label="Category"
          required
          options={CATEGORIES}
          placeholder="Choose a category…"
          defaultValue={item?.category ?? category}
        />
        <TextField
          name="subcategory"
          label="Subcategory"
          placeholder="Finisher"
          defaultValue={item?.subcategory ?? ""}
        />
        <NumberField
          name="quantity"
          label="Quantity on hand"
          required
          min={0}
          step={0.01}
          defaultValue={item?.quantity ?? 0}
        />
        <TextField
          name="unit"
          label="Unit"
          required
          placeholder="kg"
          defaultValue={item?.unit}
        />
        <MoneyField
          name="unitCostCents"
          label="Unit cost"
          required
          defaultValue={cedis(item?.unitCostCents)}
        />
        <NumberField
          name="minStock"
          label="Minimum stock"
          min={0}
          step={0.01}
          hint="Below this the board flags a reorder."
          defaultValue={item?.minStock ?? 0}
        />
        <TextField
          name="batch"
          label="Batch"
          placeholder="FB-1182"
          defaultValue={item?.batch ?? ""}
        />
        <DateField
          name="expiryDate"
          label="Expiry date"
          defaultValue={item?.expiryDate ?? ""}
        />
        <SelectField
          name="supplierId"
          label="Supplier"
          options={suppliers.map((supplier) => ({
            value: supplier.id,
            label: supplier.name,
          }))}
          placeholder="Unassigned"
          defaultValue={item?.supplierId ?? ""}
        />
      </FormGrid>
    </FormDialog>
  );
}

export function ArchiveItemDialog({ id, name }: { id: number; name: string }) {
  return (
    <ConfirmAction
      capability="inventory:write"
      trigger={{ label: `Archive ${name}`, icon: "trash", variant: "danger-icon" }}
      title="Archive item"
      message={`${name} stops appearing on the stock boards. Its movement history is kept.`}
      action={archiveInventoryItem}
      fields={{ id }}
      confirmLabel="Archive item"
      pendingLabel="Archiving…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Stock movements                                                            */
/* -------------------------------------------------------------------------- */

const MOVEMENT_COPY = {
  stock_in: {
    title: "Receive stock",
    description: "Adds to the quantity on hand and updates the unit cost.",
    submit: "Record receipt",
    icon: "stock-in",
  },
  stock_out: {
    title: "Issue stock",
    description: "Deducts from the quantity on hand.",
    submit: "Record issue",
    icon: "stock-out",
  },
  adjustment: {
    title: "Recount stock",
    description: "Sets the quantity on hand to the counted figure.",
    submit: "Record count",
    icon: "check-big",
  },
} as const;

export function StockMovementDialog({
  type,
  items,
  itemId,
  label,
  variant = "secondary",
}: {
  type: keyof typeof MOVEMENT_COPY;
  items: ItemOption[];
  /** Preselects (and locks) the item when opened from a row. */
  itemId?: number;
  label?: string;
  variant?: "primary" | "secondary" | "icon";
}) {
  const copy = MOVEMENT_COPY[type];

  return (
    <FormDialog
      capability="inventory:write"
      trigger={{
        label: label ?? copy.title,
        icon: copy.icon,
        variant,
      }}
      title={copy.title}
      description={copy.description}
      action={recordStockMovement}
      submitLabel={copy.submit}
    >
      <input type="hidden" name="type" value={type} />
      <FormGrid>
        {itemId ? (
          <HiddenField name="itemId" value={itemId} />
        ) : (
          <SelectField
            name="itemId"
            label="Item"
            required
            options={items.map((item) => ({
              value: item.id,
              label: item.unit ? `${item.name} (${item.unit})` : item.name,
            }))}
            placeholder="Choose an item…"
          />
        )}
        <NumberField
          name="quantity"
          label={type === "adjustment" ? "Counted quantity" : "Quantity"}
          required
          min={0}
          step={0.01}
        />
        <DateField
          name="occurredOn"
          label="Date"
          required
          defaultValue={today()}
        />
        {type === "stock_in" ? (
          <MoneyField name="unitCostCents" label="Unit cost" />
        ) : null}
        <TextField
          name="reference"
          label="Reference"
          placeholder="GRN-2291 / House 03"
        />
        <FullWidth>
          <TextAreaField name="note" label="Note" rows={2} />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Suppliers                                                                  */
/* -------------------------------------------------------------------------- */

export type SupplierValues = {
  id: number;
  name: string;
  location: string | null;
  category: string | null;
  contact: string | null;
  email: string | null;
  status: string;
  outstandingCents: number;
  notes: string | null;
};

const SUPPLIER_STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "overdue", label: "Payment overdue" },
];

export function SupplierDialog({ supplier }: { supplier?: SupplierValues }) {
  const editing = Boolean(supplier);

  return (
    <FormDialog
      capability="inventory:write"
      trigger={
        editing
          ? { label: `Edit ${supplier!.name}`, icon: "pencil", variant: "icon" }
          : { label: "Add Supplier", icon: "plus" }
      }
      title={editing ? `Edit ${supplier!.name}` : "Add a supplier"}
      action={saveSupplier}
      submitLabel={editing ? "Save changes" : "Add supplier"}
      size="lg"
    >
      <HiddenField name="id" value={supplier?.id} />
      <FormGrid>
        <TextField
          name="name"
          label="Supplier name"
          required
          placeholder="Zartech Feeds"
          defaultValue={supplier?.name}
        />
        <TextField
          name="category"
          label="Category"
          placeholder="Feed"
          defaultValue={supplier?.category ?? ""}
        />
        <TextField
          name="location"
          label="Location"
          placeholder="Ibadan, Oyo"
          defaultValue={supplier?.location ?? ""}
        />
        <TextField
          name="contact"
          label="Phone"
          placeholder="+234 802 000 0000"
          defaultValue={supplier?.contact ?? ""}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          placeholder="sales@supplier.com"
          defaultValue={supplier?.email ?? ""}
        />
        <SelectField
          name="status"
          label="Status"
          options={SUPPLIER_STATUS}
          defaultValue={supplier?.status ?? "active"}
        />
        <MoneyField
          name="outstandingCents"
          label="Outstanding balance"
          defaultValue={cedis(supplier?.outstandingCents)}
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            defaultValue={supplier?.notes ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function DeleteSupplierDialog({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  return (
    <ConfirmAction
      capability="inventory:write"
      trigger={{ label: `Delete ${name}`, icon: "trash", variant: "danger-icon" }}
      title="Delete supplier"
      message={`${name} will be removed. A supplier still linked to stock or expenses cannot be deleted.`}
      action={deleteSupplier}
      fields={{ id }}
      confirmLabel="Delete supplier"
      pendingLabel="Deleting…"
    />
  );
}
