"use server";

import { and, eq, inArray, sql, sum } from "drizzle-orm";

import { can } from "@/lib/auth/permissions";
import { CURRENCY_LOCALE, CURRENCY_SYMBOL } from "@/lib/currency";
import { db } from "@/lib/db";
import {
  customers,
  deliveries,
  orderEvents,
  orderItems,
  orders,
  payments,
  products,
  type OrderStatus,
} from "@/lib/db/schema";
import {
  customerSchema,
  deliverySchema,
  deliveryStatusSchema,
  idSchema,
  orderSchema,
  orderStatusSchema,
  paymentSchema,
  productSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const PRODUCT_PATHS = ["/products", "/sales", "/orders"];
const CUSTOMER_PATHS = ["/customers", "/sales", "/orders"];
const ORDER_PATHS = [
  "/",
  "/orders",
  "/sales",
  "/customers",
  "/deliveries",
  "/revenue",
  "/finance",
];
const DELIVERY_PATHS = ["/deliveries", "/orders", "/sales"];

/** The board's timeline groups a status into one of six milestones. */
const EVENT_KIND_FOR_STATUS = {
  pending: "placed",
  confirmed: "placed",
  preparing: "packed",
  ready: "packed",
  in_transit: "transit",
  delivered: "delivered",
  cancelled: "cancelled",
} as const satisfies Record<OrderStatus, string>;

const STATUS_LABEL = {
  pending: "Order pending",
  confirmed: "Order confirmed",
  preparing: "Preparing order",
  ready: "Ready for dispatch",
  in_transit: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Order cancelled",
} as const satisfies Record<OrderStatus, string>;

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                  */
/* -------------------------------------------------------------------------- */

export const saveProduct = createFormAction({
  schema: productSchema,
  capability: "sales:write",
  revalidate: PRODUCT_PATHS,
  handler: async ({ id, ...input }) => {
    // The form does not carry a status: an empty shelf is out of stock, and
    // the "low stock" badge is a stock-board threshold, not a stored choice.
    const values = {
      ...blanksToNull(input),
      status: input.availableQty <= 0 ? ("out_of_stock" as const) : ("in_stock" as const),
    };

    if (id) {
      const [row] = await db
        .update(products)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning({ id: products.id });

      if (!row) throw new ActionError("That product no longer exists.");
      return { message: `${input.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(products)
      .values(values)
      .returning({ id: products.id });

    return { message: `${input.name} added.`, id: row.id };
  },
});

/** Past order lines still name the product, so it is retired, not removed. */
export const archiveProduct = createFormAction({
  schema: idSchema,
  capability: "sales:write",
  revalidate: PRODUCT_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .update(products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning({ name: products.name });

    if (!row) throw new ActionError("That product no longer exists.");
    return { message: `${row.name} archived.` };
  },
});

export const saveCustomer = createFormAction({
  schema: customerSchema,
  capability: "sales:write",
  revalidate: CUSTOMER_PATHS,
  handler: async ({ id, ...input }) => {
    const values = blanksToNull(input);

    if (id) {
      const [row] = await db
        .update(customers)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(customers.id, id))
        .returning({ id: customers.id });

      if (!row) throw new ActionError("That customer no longer exists.");
      return { message: `${input.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(customers)
      .values(values)
      .returning({ id: customers.id });

    return { message: `${input.name} added.`, id: row.id };
  },
});

/* -------------------------------------------------------------------------- */
/* Orders                                                                     */
/* -------------------------------------------------------------------------- */

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** `ORD-2841` → `ORD-2842`, continuing the sequence the board displays. */
async function nextOrderReference(tx: Tx) {
  const [row] = await tx
    .select({
      highest: sql<number | null>`max((substring(${orders.reference} from '[0-9]+$'))::int)`,
    })
    .from(orders);

  return `ORD-${(row?.highest ?? 2800) + 1}`;
}

/**
 * Prices are read from the catalogue rather than taken from the submission, so
 * a tampered payload cannot set its own price. Only the product and quantity
 * come from the client.
 */
async function buildLines(tx: Tx, lines: { productId: number; quantity: number }[]) {
  const ids = [...new Set(lines.map((line) => line.productId))];
  const catalogue = await tx
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      priceCents: products.priceCents,
    })
    .from(products)
    .where(inArray(products.id, ids));

  const byId = new Map(catalogue.map((product) => [product.id, product]));

  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new ActionError("One of the products is no longer available.", {
        items: ["One of the products is no longer available."],
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      unit: product.unit,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
      lineTotalCents: Math.round(line.quantity * product.priceCents),
    };
  });
}

/** Cents as money, for the sentences a rejected payment comes back with. */
function amountOf(cents: number) {
  return `${CURRENCY_SYMBOL}${(cents / 100).toLocaleString(CURRENCY_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Anything already received against the order decides its payment status. */
async function syncPaymentStatus(tx: Tx, orderId: number, totalCents: number) {
  const [row] = await tx
    .select({ paid: sum(payments.amountCents) })
    .from(payments)
    .where(eq(payments.orderId, orderId));

  const paid = Number(row?.paid ?? 0);
  const status = paid <= 0 ? "unpaid" : paid < totalCents ? "partial" : "paid";

  await tx
    .update(orders)
    .set({ paymentStatus: status, updatedAt: new Date() })
    .where(eq(orders.id, orderId));

  return { paid, status };
}

export const saveOrder = createFormAction({
  schema: orderSchema,
  capability: "sales:write",
  revalidate: ORDER_PATHS,
  handler: async ({ id, items, ...input }, { user }) => {
    return db.transaction(async (tx) => {
      const lines = await buildLines(tx, items);
      const subtotalCents = lines.reduce((total, line) => total + line.lineTotalCents, 0);
      const totalCents = subtotalCents + input.deliveryFeeCents;

      const values = {
        ...blanksToNull(input),
        subtotalCents,
        totalCents,
      };

      let orderId: number;
      let reference: string;

      if (id) {
        const [row] = await tx
          .update(orders)
          .set({ ...values, updatedAt: new Date() })
          .where(eq(orders.id, id))
          .returning({ id: orders.id, reference: orders.reference });

        if (!row) throw new ActionError("That order no longer exists.");
        orderId = row.id;
        reference = row.reference;

        // The lines are replaced wholesale; editing them individually would
        // need line identity the form does not carry.
        await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
      } else {
        reference = await nextOrderReference(tx);
        const [row] = await tx
          .insert(orders)
          .values({ ...values, reference, createdById: user.id })
          .returning({ id: orders.id });

        orderId = row.id;

        await tx.insert(orderEvents).values({
          orderId,
          kind: "placed",
          title: "Order placed",
          description: `${lines.length} line${lines.length === 1 ? "" : "s"} recorded by ${user.name}.`,
          createdById: user.id,
        });
      }

      await tx
        .insert(orderItems)
        .values(lines.map((line) => ({ ...line, orderId })));

      await syncPaymentStatus(tx, orderId, totalCents);

      return {
        message: id ? `${reference} updated.` : `${reference} created.`,
        id: orderId,
      };
    });
  },
});

export const setOrderStatus = createFormAction({
  schema: orderStatusSchema,
  capability: "sales:write",
  revalidate: ORDER_PATHS,
  handler: async ({ id, status }, { user }) => {
    return db.transaction(async (tx) => {
      const [row] = await tx
        .update(orders)
        .set({ status, updatedAt: new Date() })
        .where(eq(orders.id, id))
        .returning({ reference: orders.reference });

      if (!row) throw new ActionError("That order no longer exists.");

      await tx.insert(orderEvents).values({
        orderId: id,
        kind: EVENT_KIND_FOR_STATUS[status],
        title: STATUS_LABEL[status],
        description: `Updated by ${user.name}.`,
        createdById: user.id,
      });

      return { message: `${row.reference}: ${STATUS_LABEL[status].toLowerCase()}.` };
    });
  },
});

export const recordPayment = createFormAction({
  schema: paymentSchema,
  capability: "sales:write",
  revalidate: [...ORDER_PATHS, "/expenses"],
  handler: async (input, { user }) => {
    return db.transaction(async (tx) => {
      let customerId = input.customerId;
      let totalCents: number | null = null;
      let reference: string | null = null;

      if (input.orderId) {
        const [order] = await tx
          .select({
            id: orders.id,
            reference: orders.reference,
            customerId: orders.customerId,
            totalCents: orders.totalCents,
          })
          .from(orders)
          .where(eq(orders.id, input.orderId))
          .limit(1);

        if (!order) throw new ActionError("That order no longer exists.");
        customerId = customerId ?? order.customerId;
        totalCents = order.totalCents;
        reference = order.reference;

        // Anything already received has to be counted before this payment is
        // allowed to land, or a mistyped amount — 50000 for 500.00 — is taken
        // silently, marked "paid", and carried into the revenue figures with
        // nothing to show it was wrong.
        const [received] = await tx
          .select({ paid: sum(payments.amountCents) })
          .from(payments)
          .where(eq(payments.orderId, order.id));

        const alreadyPaid = Number(received?.paid ?? 0);
        const outstanding = order.totalCents - alreadyPaid;

        if (input.amountCents > outstanding) {
          throw new ActionError(
            outstanding <= 0
              ? `${order.reference} is already paid in full.`
              : `${order.reference} has ${amountOf(outstanding)} outstanding.`,
            {
              amountCents: [
                outstanding <= 0
                  ? "This order has nothing left to pay."
                  : `More than the ${amountOf(outstanding)} outstanding.`,
              ],
            },
          );
        }
      }

      const [payment] = await tx
        .insert(payments)
        .values({ ...blanksToNull(input), customerId, createdById: user.id })
        .returning({ id: payments.id });

      if (input.orderId && totalCents !== null) {
        const { status } = await syncPaymentStatus(tx, input.orderId, totalCents);

        await tx.insert(orderEvents).values({
          orderId: input.orderId,
          kind: "payment",
          title: status === "paid" ? "Payment completed" : "Payment received",
          description: `Recorded by ${user.name}.`,
          createdById: user.id,
        });
      }

      return {
        message: reference
          ? `Payment recorded against ${reference}.`
          : "Payment recorded.",
        id: payment.id,
      };
    });
  },
});

/* -------------------------------------------------------------------------- */
/* Deliveries                                                                 */
/* -------------------------------------------------------------------------- */

export const saveDelivery = createFormAction({
  schema: deliverySchema,
  capability: "sales:write",
  revalidate: DELIVERY_PATHS,
  handler: async ({ id, ...input }) => {
    const values = blanksToNull(input);

    if (id) {
      const [row] = await db
        .update(deliveries)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(deliveries.id, id))
        .returning({ id: deliveries.id });

      if (!row) throw new ActionError("That delivery no longer exists.");
      return { message: "Delivery updated.", id: row.id };
    }

    const [row] = await db
      .insert(deliveries)
      .values(values)
      .returning({ id: deliveries.id });

    return { message: "Delivery scheduled.", id: row.id };
  },
});

/**
 * The delivery run drives the order: a completed drop marks the order
 * delivered, a failed one counts the attempt for the retry list.
 */
export const setDeliveryStatus = createFormAction({
  schema: deliveryStatusSchema,
  // Narrower than `sales:write`: closing off a run is the driver's job, while
  // raising or re-routing one stays with Sales.
  capability: "deliveries:write",
  revalidate: [...DELIVERY_PATHS, "/"],
  handler: async ({ id, status, notes }, { user }) => {
    return db.transaction(async (tx) => {
      /*
       * A driver holds `deliveries:write` for their own run sheet, not for the
       * whole fleet's. Roles that can schedule deliveries in the first place —
       * Sales, and above — may update any of them; a driver is held to the
       * drops assigned to them, which the capability alone cannot express.
       */
      const ownRunOnly = !can(user.role, "sales:write");

      const [delivery] = await tx
        .update(deliveries)
        .set({
          status,
          ...(notes ? { notes } : {}),
          ...(status === "failed" ? { attempts: sql`${deliveries.attempts} + 1` } : {}),
          updatedAt: new Date(),
        })
        .where(
          ownRunOnly
            ? and(eq(deliveries.id, id), eq(deliveries.driverId, user.id))
            : eq(deliveries.id, id),
        )
        .returning({
          orderId: deliveries.orderId,
          destination: deliveries.destination,
        });

      if (!delivery && ownRunOnly) {
        // Distinguishing "gone" from "not yours" would confirm the existence
        // of another driver's run, so both answer the same way.
        const [exists] = await tx
          .select({ id: deliveries.id })
          .from(deliveries)
          .where(eq(deliveries.id, id))
          .limit(1);

        if (exists) {
          throw new ActionError("That delivery is assigned to another driver.");
        }
      }

      if (!delivery) throw new ActionError("That delivery no longer exists.");

      if (status === "delivered" || status === "in_transit") {
        const orderStatus = status === "delivered" ? "delivered" : "in_transit";

        await tx
          .update(orders)
          .set({ status: orderStatus, updatedAt: new Date() })
          .where(eq(orders.id, delivery.orderId));

        await tx.insert(orderEvents).values({
          orderId: delivery.orderId,
          kind: EVENT_KIND_FOR_STATUS[orderStatus],
          title: STATUS_LABEL[orderStatus],
          description: `${delivery.destination} — updated by ${user.name}.`,
          createdById: user.id,
        });
      }

      return { message: `Delivery to ${delivery.destination} updated.` };
    });
  },
});
