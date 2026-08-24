import "server-only";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import {
  AuthorizationError,
  requireCapability,
  type SessionUser,
} from "@/lib/auth/session";
import type { Capability } from "@/lib/auth/permissions";

import {
  errorState,
  successState,
  type ActionState,
  type FieldErrors,
} from "./types";

/**
 * A rule the database cannot express — "that row is gone", "the stock would go
 * negative". Thrown by a handler and rendered as a normal form error rather
 * than the generic failure message.
 */
export class ActionError extends Error {
  fieldErrors?: FieldErrors;

  constructor(message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ActionError";
    this.fieldErrors = fieldErrors;
  }
}

/** Postgres error codes we can turn into a sentence a user understands. */
const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";
const PG_NOT_NULL_VIOLATION = "23502";
const PG_CHECK_VIOLATION = "23514";

type PostgresError = Error & {
  code?: string;
  constraint?: string;
  detail?: string;
  column?: string;
};

/**
 * Drizzle wraps every failed query in a `DrizzleQueryError`, which carries none
 * of the driver's fields itself — the `pg` error, with its code and constraint
 * name, sits underneath on `cause`. Reading only the thrown value would miss
 * every database error there is, so walk the chain to the first link that
 * actually looks like one.
 */
function postgresErrorOf(error: unknown): PostgresError | undefined {
  for (let link = error; link instanceof Error; link = link.cause) {
    if (typeof (link as PostgresError).code === "string") return link as PostgresError;
  }
  return undefined;
}

/**
 * Maps a unique-index name to the form field that caused it, so a duplicate
 * shows up under the offending input instead of as a generic banner.
 */
const UNIQUE_CONSTRAINT_FIELDS: Record<string, { field: string; message: string }> = {
  users_email_unique: { field: "email", message: "That email is already registered." },
  houses_code_unique: { field: "code", message: "A house with that code already exists." },
  flocks_code_unique: { field: "code", message: "A flock with that ID already exists." },
  inventory_items_sku_unique: { field: "sku", message: "That SKU is already in use." },
  suppliers_name_unique: { field: "name", message: "A supplier with that name already exists." },
  customers_name_unique: { field: "name", message: "A customer with that name already exists." },
  products_name_unique: { field: "name", message: "A product with that name already exists." },
  orders_reference_unique: { field: "reference", message: "That order reference is already taken." },
  daily_records_house_date_unique: {
    field: "recordDate",
    message: "A daily record already exists for this house on that date.",
  },
  notification_prefs_user_channel_unique: {
    field: "channel",
    message: "That channel already has a preference set.",
  },
};

/**
 * An optional field left blank parses to `undefined`, and Drizzle skips
 * `undefined` on an update — which would silently keep the old value instead of
 * clearing it. Mapping them to `null` first makes "cleared" mean cleared.
 */
export function blanksToNull<T extends Record<string, unknown>>(values: T) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      value === undefined ? null : value,
    ]),
  ) as {
    [K in keyof T]: undefined extends T[K] ? Exclude<T[K], undefined> | null : T[K];
  };
}

/** Turns any thrown value into an `ActionState` without leaking internals. */
export function toErrorState(
  error: unknown,
  values?: Record<string, string>,
): ActionState {
  if (error instanceof AuthorizationError) {
    return errorState(error.message, undefined, values);
  }

  if (error instanceof ActionError) {
    return errorState(error.message, error.fieldErrors, values);
  }

  const postgres = postgresErrorOf(error);
  if (postgres) {
    if (postgres.code === PG_UNIQUE_VIOLATION) {
      const mapped = postgres.constraint
        ? UNIQUE_CONSTRAINT_FIELDS[postgres.constraint]
        : undefined;
      if (mapped) {
        return errorState(
          mapped.message,
          { [mapped.field]: [mapped.message] },
          values,
        );
      }
      return errorState("That record already exists.", undefined, values);
    }

    if (postgres.code === PG_FOREIGN_KEY_VIOLATION) {
      return errorState(
        "A linked record is missing or still in use. Refresh and try again.",
        undefined,
        values,
      );
    }

    if (postgres.code === PG_NOT_NULL_VIOLATION) {
      return errorState(
        `"${postgres.column ?? "A required field"}" is required.`,
        postgres.column
          ? { [postgres.column]: ["This field is required."] }
          : undefined,
        values,
      );
    }

    if (postgres.code === PG_CHECK_VIOLATION) {
      return errorState("Some values are out of the allowed range.", undefined, values);
    }
  }

  // Anything unexpected is logged server-side and generalised for the client.
  console.error("[action] unhandled error:", error);
  return errorState(
    "Something went wrong while saving. Please try again.",
    undefined,
    values,
  );
}

/**
 * `FormData` keeps every value as a string. Empty strings are dropped so
 * optional fields fall through to their schema defaults instead of failing a
 * type check, and repeated keys collapse into arrays for multi-selects.
 */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key.startsWith("$ACTION")) continue;

    const trimmed = value.trim();
    if (trimmed === "") continue;

    const existing = result[key];
    if (existing === undefined) {
      result[key] = trimmed;
    } else if (Array.isArray(existing)) {
      existing.push(trimmed);
    } else {
      result[key] = [existing, trimmed];
    }
  }

  return result;
}

/** Snapshot of the raw submission, echoed back so a failed form repopulates. */
function rawValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File || key.startsWith("$ACTION")) continue;
    values[key] = value;
  }
  return values;
}

export type ActionContext = { user: SessionUser };

type HandlerResult = { message: string; id?: number } | void;

/**
 * Builds a Server Action from a Zod schema and a handler:
 *
 *  1. verifies the session and the caller's capability
 *  2. validates the submitted `FormData`
 *  3. runs the handler
 *  4. revalidates the affected routes
 *
 * Validation and authorization failures come back as data (never thrown), so
 * the form can render them inline.
 */
export function createFormAction<Schema extends z.ZodType>(options: {
  schema: Schema;
  capability: Capability;
  /** Paths to revalidate after a successful mutation. */
  revalidate?: string[];
  successMessage?: string;
  handler: (
    input: z.output<Schema>,
    context: ActionContext,
  ) => Promise<HandlerResult>;
}) {
  return async function action(
    _previous: ActionState,
    formData: FormData,
  ): Promise<ActionState> {
    const values = rawValues(formData);

    try {
      const user = await requireCapability(options.capability);

      const parsed = options.schema.safeParse(formDataToObject(formData));
      if (!parsed.success) {
        const flat = z.flattenError(parsed.error);
        return {
          status: "error",
          message:
            flat.formErrors[0] ?? "Please correct the highlighted fields.",
          fieldErrors: flat.fieldErrors as Record<string, string[]>,
          values,
        };
      }

      const result = await options.handler(parsed.data, { user });

      for (const path of options.revalidate ?? []) {
        // A path holding a dynamic segment ("/flocks/[flockId]") only matches
        // when the type is given explicitly.
        revalidatePath(path, path.includes("[") ? "page" : undefined);
      }

      return successState(
        result?.message ?? options.successMessage ?? "Saved.",
        result?.id,
      );
    } catch (error) {
      // `redirect()` and `notFound()` signal control flow by throwing.
      unstable_rethrow(error);
      return toErrorState(error, values);
    }
  };
}
