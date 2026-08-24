"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { inventoryItems, inventoryMovements, suppliers } from "@/lib/db/schema";
import {
  idSchema,
  inventoryItemSchema,
  stockMovementSchema,
  supplierSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

/** Feed and medicines are filtered views over the same stock ledger. */
const STOCK_PATHS = ["/", "/inventory", "/feed", "/medicines"];
const SUPPLIER_PATHS = ["/suppliers", "/inventory", "/expenses"];

export const saveSupplier = createFormAction({
  schema: supplierSchema,
  capability: "inventory:write",
  revalidate: SUPPLIER_PATHS,
  handler: async ({ id, ...input }) => {
    const values = blanksToNull(input);

    if (id) {
      const [row] = await db
        .update(suppliers)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(suppliers.id, id))
        .returning({ id: suppliers.id });

      if (!row) throw new ActionError("That supplier no longer exists.");
      return { message: `${input.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(suppliers)
      .values(values)
      .returning({ id: suppliers.id });

    return { message: `${input.name} added.`, id: row.id };
  },
});

export const deleteSupplier = createFormAction({
  schema: idSchema,
  capability: "inventory:write",
  revalidate: SUPPLIER_PATHS,
  handler: async ({ id }) => {
    const [{ value: items }] = await db
      .select({ value: count() })
      .from(inventoryItems)
      .where(eq(inventoryItems.supplierId, id));

    if (items > 0) {
      throw new ActionError(
        "Stock items still point at this supplier. Mark it inactive instead.",
      );
    }

    const [row] = await db
      .delete(suppliers)
      .where(eq(suppliers.id, id))
      .returning({ name: suppliers.name });

    if (!row) throw new ActionError("That supplier no longer exists.");
    return { message: `${row.name} deleted.` };
  },
});

export const saveInventoryItem = createFormAction({
  schema: inventoryItemSchema,
  capability: "inventory:write",
  revalidate: STOCK_PATHS,
  handler: async ({ id, ...input }) => {
    const values = blanksToNull(input);

    if (id) {
      const [row] = await db
        .update(inventoryItems)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(inventoryItems.id, id))
        .returning({ id: inventoryItems.id });

      if (!row) throw new ActionError("That item no longer exists.");
      return { message: `${input.name} updated.`, id: row.id };
    }

    const [row] = await db
      .insert(inventoryItems)
      .values(values)
      .returning({ id: inventoryItems.id });

    return { message: `${input.name} added to stock.`, id: row.id };
  },
});

/**
 * Movements are the item's history, so a used item is archived rather than
 * deleted — a delete would cascade the ledger away with it.
 */
export const archiveInventoryItem = createFormAction({
  schema: idSchema,
  capability: "inventory:write",
  revalidate: STOCK_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .update(inventoryItems)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(inventoryItems.id, id))
      .returning({ name: inventoryItems.name });

    if (!row) throw new ActionError("That item no longer exists.");
    return { message: `${row.name} archived.` };
  },
});

/**
 * The one place stock quantity changes. `stock_in` and `stock_out` are deltas;
 * `adjustment` is a recount and sets the on-hand figure outright. Movement and
 * balance are written together so a failure cannot leave them disagreeing.
 *
 * The new balance is computed by the database from the column's own value
 * rather than from one this request read a moment earlier. Reading the quantity
 * into JavaScript and writing back the arithmetic would let two overlapping
 * issues both pass a check only one of them should, and the store would go on
 * to hand out stock it does not have — the ledger and the balance disagreeing
 * for good. The `>=` in the stock-out clause is the check itself, applied by
 * the same statement that does the subtraction and against the row it locks.
 */
export const recordStockMovement = createFormAction({
  schema: stockMovementSchema,
  capability: "inventory:write",
  revalidate: STOCK_PATHS,
  handler: async (input, { user }) => {
    return db.transaction(async (tx) => {
      const [item] = await tx
        .select({
          id: inventoryItems.id,
          name: inventoryItems.name,
          unit: inventoryItems.unit,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.id, input.itemId))
        .limit(1);

      if (!item) throw new ActionError("That item no longer exists.");

      const quantityExpression =
        input.type === "stock_in"
          ? sql`${inventoryItems.quantity} + ${input.quantity}`
          : input.type === "stock_out"
            ? sql`${inventoryItems.quantity} - ${input.quantity}`
            : sql`${input.quantity}`;

      const [balance] = await tx
        .update(inventoryItems)
        .set({
          quantity: quantityExpression,
          // A receipt carries the price actually paid, which becomes the
          // item's current unit cost.
          ...(input.type === "stock_in" && input.unitCostCents !== undefined
            ? { unitCostCents: input.unitCostCents }
            : {}),
          updatedAt: new Date(),
        })
        .where(
          input.type === "stock_out"
            ? and(
                eq(inventoryItems.id, item.id),
                gte(inventoryItems.quantity, input.quantity),
              )
            : eq(inventoryItems.id, item.id),
        )
        .returning({ quantity: inventoryItems.quantity });

      // Only a stock-out can match nothing here, and only for want of stock —
      // the row itself was found above, inside this same transaction.
      if (!balance) {
        const [current] = await tx
          .select({ quantity: inventoryItems.quantity })
          .from(inventoryItems)
          .where(eq(inventoryItems.id, item.id))
          .limit(1);

        throw new ActionError(
          `Only ${current?.quantity ?? 0} ${item.unit} of ${item.name} is on hand.`,
          { quantity: ["More than the quantity in stock."] },
        );
      }

      const [movement] = await tx
        .insert(inventoryMovements)
        .values({ ...blanksToNull(input), createdById: user.id })
        .returning({ id: inventoryMovements.id });

      const verb =
        input.type === "stock_in"
          ? "received"
          : input.type === "stock_out"
            ? "issued"
            : "recounted";

      return {
        message: `${item.name} ${verb}. On hand: ${balance.quantity} ${item.unit}.`,
        id: movement.id,
      };
    });
  },
});
