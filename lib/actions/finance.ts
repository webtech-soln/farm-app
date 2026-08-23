"use server";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import {
  expenseSchema,
  expenseStatusSchema,
  idSchema,
} from "@/lib/validation/schemas";

import { ActionError, blanksToNull, createFormAction } from "./handler";

const FINANCE_PATHS = ["/", "/expenses", "/finance", "/reports", "/suppliers"];

export const saveExpense = createFormAction({
  schema: expenseSchema,
  capability: "finance:write",
  revalidate: FINANCE_PATHS,
  handler: async ({ id, ...input }, { user }) => {
    const values = { ...blanksToNull(input), recordedById: user.id };

    if (id) {
      const [row] = await db
        .update(expenses)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(expenses.id, id))
        .returning({ id: expenses.id });

      if (!row) throw new ActionError("That expense no longer exists.");
      return { message: "Expense updated.", id: row.id };
    }

    const [row] = await db
      .insert(expenses)
      .values(values)
      .returning({ id: expenses.id });

    return { message: "Expense recorded.", id: row.id };
  },
});

/** Approving or rejecting from the expense queue. */
export const setExpenseStatus = createFormAction({
  schema: expenseStatusSchema,
  capability: "finance:write",
  revalidate: FINANCE_PATHS,
  handler: async ({ id, status }) => {
    const [row] = await db
      .update(expenses)
      .set({ status, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning({ description: expenses.description });

    if (!row) throw new ActionError("That expense no longer exists.");
    return { message: `${row.description} ${status}.` };
  },
});

export const deleteExpense = createFormAction({
  schema: idSchema,
  capability: "finance:write",
  revalidate: FINANCE_PATHS,
  handler: async ({ id }) => {
    const [row] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });

    if (!row) throw new ActionError("That expense no longer exists.");
    return { message: "Expense deleted." };
  },
});
