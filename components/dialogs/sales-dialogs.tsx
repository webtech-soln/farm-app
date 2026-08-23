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
  TimeField,
} from "@/components/form/fields";
import { ConfirmAction, FormDialog } from "@/components/form/form-dialog";
import { OrderLines, type ProductOption } from "@/components/form/order-lines";
import {
  archiveProduct,
  recordPayment,
  saveCustomer,
  saveDelivery,
  saveOrder,
  saveProduct,
  setDeliveryStatus,
  setOrderStatus,
} from "@/lib/actions/sales";
import { todayIso } from "@/lib/date";

const today = todayIso;
const dollars = (cents: number | undefined | null) =>
  cents === undefined || cents === null ? "" : (cents / 100).toFixed(2);

export type CustomerOption = { id: number; name: string };
export type OrderOption = { id: number; reference: string; customerName?: string };
export type DriverOption = { id: number; name: string };

/* -------------------------------------------------------------------------- */
/* Products                                                                   */
/* -------------------------------------------------------------------------- */

export type ProductValues = {
  id: number;
  name: string;
  category: string;
  icon: string;
  priceCents: number;
  costCents: number;
  unit: string;
  availableQty: number;
  availableUnit: string | null;
  note: string | null;
};

const PRODUCT_ICONS = [
  { value: "package", label: "Package" },
  { value: "egg", label: "Egg" },
  { value: "bird", label: "Bird" },
  { value: "sprout", label: "Sprout" },
  { value: "layers", label: "Layers" },
  { value: "beef", label: "Beef" },
];

export function ProductDialog({ product }: { product?: ProductValues }) {
  const editing = Boolean(product);

  return (
    <FormDialog
      capability="sales:write"
      trigger={
        editing
          ? { label: `Edit ${product!.name}`, icon: "pencil", variant: "icon" }
          : { label: "Add Product", icon: "plus" }
      }
      title={editing ? `Edit ${product!.name}` : "Add a product"}
      action={saveProduct}
      submitLabel={editing ? "Save changes" : "Add product"}
      size="lg"
    >
      <HiddenField name="id" value={product?.id} />
      <FormGrid>
        <TextField
          name="name"
          label="Product name"
          required
          placeholder="Table eggs (crate)"
          defaultValue={product?.name}
        />
        <TextField
          name="category"
          label="Category"
          required
          placeholder="Eggs"
          defaultValue={product?.category}
        />
        <MoneyField
          name="priceCents"
          label="Selling price"
          required
          defaultValue={dollars(product?.priceCents)}
        />
        <MoneyField
          name="costCents"
          label="Unit cost"
          defaultValue={dollars(product?.costCents)}
        />
        <TextField
          name="unit"
          label="Unit"
          required
          placeholder="crate"
          defaultValue={product?.unit}
        />
        <NumberField
          name="availableQty"
          label="Available quantity"
          min={0}
          step={0.01}
          defaultValue={product?.availableQty ?? 0}
        />
        <TextField
          name="availableUnit"
          label="Available unit"
          placeholder="crates"
          defaultValue={product?.availableUnit ?? ""}
        />
        <SelectField
          name="icon"
          label="Icon"
          options={PRODUCT_ICONS}
          defaultValue={product?.icon ?? "package"}
        />
        <FullWidth>
          <TextField
            name="note"
            label="Note"
            placeholder="Grade A only"
            defaultValue={product?.note ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function ArchiveProductDialog({
  id,
  name,
}: {
  id: number;
  name: string;
}) {
  return (
    <ConfirmAction
      capability="sales:write"
      trigger={{ label: `Archive ${name}`, icon: "trash", variant: "danger-icon" }}
      title="Archive product"
      message={`${name} stops appearing on the price list. Existing order lines keep it.`}
      action={archiveProduct}
      fields={{ id }}
      confirmLabel="Archive product"
      pendingLabel="Archiving…"
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Customers                                                                  */
/* -------------------------------------------------------------------------- */

export type CustomerValues = {
  id: number;
  name: string;
  type: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  creditLimitCents: number | null;
  notes: string | null;
};

const CUSTOMER_TYPES = [
  { value: "wholesaler", label: "Wholesaler" },
  { value: "retailer", label: "Retailer" },
  { value: "restaurant", label: "Restaurant / hotel" },
  { value: "walk_in", label: "Walk-in" },
];

const CUSTOMER_STATUS = [
  { value: "active", label: "Active" },
  { value: "dormant", label: "Dormant" },
  { value: "overdue", label: "Payment overdue" },
];

export function CustomerDialog({ customer }: { customer?: CustomerValues }) {
  const editing = Boolean(customer);

  return (
    <FormDialog
      capability="sales:write"
      trigger={
        editing
          ? { label: `Edit ${customer!.name}`, icon: "pencil", variant: "icon" }
          : { label: "Add Customer", icon: "plus" }
      }
      title={editing ? `Edit ${customer!.name}` : "Add a customer"}
      action={saveCustomer}
      submitLabel={editing ? "Save changes" : "Add customer"}
      size="lg"
    >
      <HiddenField name="id" value={customer?.id} />
      <FormGrid>
        <TextField
          name="name"
          label="Customer name"
          required
          placeholder="Mama Nkechi Stores"
          defaultValue={customer?.name}
        />
        <SelectField
          name="type"
          label="Type"
          required
          options={CUSTOMER_TYPES}
          placeholder="Choose a type…"
          defaultValue={customer?.type}
        />
        <TextField
          name="location"
          label="Location"
          placeholder="Abeokuta, Ogun"
          defaultValue={customer?.location ?? ""}
        />
        <TextField
          name="phone"
          label="Phone"
          placeholder="+234 802 000 0000"
          defaultValue={customer?.phone ?? ""}
        />
        <TextField
          name="email"
          label="Email"
          type="email"
          defaultValue={customer?.email ?? ""}
        />
        <SelectField
          name="status"
          label="Status"
          options={CUSTOMER_STATUS}
          defaultValue={customer?.status ?? "active"}
        />
        <MoneyField
          name="creditLimitCents"
          label="Credit limit"
          defaultValue={dollars(customer?.creditLimitCents)}
        />
        <FullWidth>
          <TextAreaField
            name="notes"
            label="Notes"
            defaultValue={customer?.notes ?? ""}
          />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

const ORDER_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const DELIVERY_METHODS = [
  { value: "own_fleet", label: "Own fleet" },
  { value: "pickup", label: "Customer pickup" },
  { value: "third_party", label: "Third party" },
];

export function OrderDialog({
  customers,
  products,
  label = "Create Order",
}: {
  customers: CustomerOption[];
  products: ProductOption[];
  label?: string;
}) {
  return (
    <FormDialog
      capability="sales:write"
      trigger={{ label, icon: "plus" }}
      title="Create an order"
      description="Line totals, subtotal and payment status are all derived on save."
      action={saveOrder}
      submitLabel="Create order"
      size="lg"
    >
      <FormGrid>
        <SelectField
          name="customerId"
          label="Customer"
          required
          options={customers.map((customer) => ({
            value: customer.id,
            label: customer.name,
          }))}
          placeholder="Choose a customer…"
        />
        <SelectField
          name="deliveryMethod"
          label="Delivery method"
          options={DELIVERY_METHODS}
          defaultValue="own_fleet"
        />
        <SelectField
          name="status"
          label="Status"
          options={ORDER_STATUS}
          defaultValue="pending"
        />
        <MoneyField name="deliveryFeeCents" label="Delivery fee" />
      </FormGrid>
      <OrderLines products={products} />
      <TextAreaField name="notes" label="Notes" rows={2} />
    </FormDialog>
  );
}

export function OrderStatusDialog({
  id,
  reference,
  status,
}: {
  id: number;
  reference: string;
  status: string;
}) {
  return (
    <FormDialog
      capability="sales:write"
      trigger={{ label: `Update ${reference}`, icon: "check-big", variant: "icon" }}
      title={`Update ${reference}`}
      description="Each change is written to the order's timeline."
      size="sm"
      action={setOrderStatus}
      submitLabel="Update status"
    >
      <HiddenField name="id" value={id} />
      <SelectField
        name="status"
        label="Status"
        required
        options={ORDER_STATUS}
        defaultValue={status}
      />
    </FormDialog>
  );
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile money" },
  { value: "cheque", label: "Cheque" },
  { value: "part_cash", label: "Part cash" },
];

export function PaymentDialog({
  orders,
  customers,
  orderId,
  reference,
  variant = "secondary",
  label,
}: {
  orders?: OrderOption[];
  customers?: CustomerOption[];
  orderId?: number;
  reference?: string;
  variant?: "primary" | "secondary" | "icon";
  label?: string;
}) {
  return (
    <FormDialog
      capability="sales:write"
      trigger={{
        label: label ?? (reference ? `Record payment for ${reference}` : "Record Payment"),
        icon: "card",
        variant,
      }}
      title="Record a payment"
      description="Payments settle against the order and move it to partial or paid."
      action={recordPayment}
      submitLabel="Record payment"
    >
      <FormGrid>
        {orderId ? (
          <HiddenField name="orderId" value={orderId} />
        ) : (
          <SelectField
            name="orderId"
            label="Order"
            options={(orders ?? []).map((order) => ({
              value: order.id,
              label: order.customerName
                ? `${order.reference} · ${order.customerName}`
                : order.reference,
            }))}
            placeholder="Not linked to an order"
          />
        )}
        {orderId ? null : (
          <SelectField
            name="customerId"
            label="Customer"
            options={(customers ?? []).map((customer) => ({
              value: customer.id,
              label: customer.name,
            }))}
            placeholder="Unassigned"
            hint="Only needed when no order is selected."
          />
        )}
        <MoneyField name="amountCents" label="Amount" required />
        <SelectField
          name="method"
          label="Method"
          options={PAYMENT_METHODS}
          defaultValue="bank_transfer"
        />
        <DateField
          name="receivedOn"
          label="Received on"
          required
          defaultValue={today()}
        />
        <TextField
          name="reference"
          label="Reference"
          placeholder="TRF-8821"
        />
        <FullWidth>
          <TextField name="description" label="Description" />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Deliveries                                                                 */
/* -------------------------------------------------------------------------- */

const DELIVERY_STATUS = [
  { value: "scheduled", label: "Scheduled" },
  { value: "preparing", label: "Preparing" },
  { value: "in_transit", label: "In transit" },
  { value: "delivered", label: "Delivered" },
  { value: "failed", label: "Failed" },
];

export function DeliveryDialog({
  orders,
  drivers,
}: {
  orders: OrderOption[];
  drivers: DriverOption[];
}) {
  return (
    <FormDialog
      capability="sales:write"
      trigger={{ label: "Schedule Delivery", icon: "plus" }}
      title="Schedule a delivery"
      description="Only orders that are confirmed and not yet dispatched appear here."
      action={saveDelivery}
      submitLabel="Schedule delivery"
      size="lg"
    >
      <FormGrid>
        <SelectField
          name="orderId"
          label="Order"
          required
          options={orders.map((order) => ({
            value: order.id,
            label: order.customerName
              ? `${order.reference} · ${order.customerName}`
              : order.reference,
          }))}
          placeholder="Choose an order…"
        />
        <SelectField
          name="driverId"
          label="Driver"
          options={drivers.map((driver) => ({
            value: driver.id,
            label: driver.name,
          }))}
          placeholder="Unassigned"
        />
        <TextField
          name="destination"
          label="Destination"
          required
          placeholder="Abeokuta central market"
        />
        <TextField name="routeName" label="Route" placeholder="Abeokuta run" />
        <DateField
          name="scheduledOn"
          label="Scheduled on"
          required
          defaultValue={today()}
        />
        <SelectField
          name="status"
          label="Status"
          options={DELIVERY_STATUS}
          defaultValue="scheduled"
        />
        <TimeField name="windowStart" label="Window opens" />
        <TimeField name="windowEnd" label="Window closes" />
        <NumberField
          name="weightKg"
          label="Load weight"
          min={0}
          step={0.1}
          unit="kg"
        />
        <FullWidth>
          <TextAreaField name="notes" label="Notes" rows={2} />
        </FullWidth>
      </FormGrid>
    </FormDialog>
  );
}

export function DeliveryStatusDialog({
  id,
  destination,
  status,
}: {
  id: number;
  destination: string;
  status: string;
}) {
  return (
    <FormDialog
      capability="sales:write"
      trigger={{
        label: `Update delivery to ${destination}`,
        icon: "truck",
        variant: "icon",
      }}
      title="Update delivery"
      description="Marking a delivery as delivered also closes its order."
      size="sm"
      action={setDeliveryStatus}
      submitLabel="Update delivery"
    >
      <HiddenField name="id" value={id} />
      <SelectField
        name="status"
        label="Status"
        required
        options={DELIVERY_STATUS}
        defaultValue={status}
      />
      <TextAreaField name="notes" label="Note" rows={2} />
    </FormDialog>
  );
}
