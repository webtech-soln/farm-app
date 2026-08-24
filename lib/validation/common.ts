import { z } from "zod";

import { stripCurrency } from "@/lib/currency";

/**
 * Everything arriving from a `<form>` is a string, so these helpers coerce and
 * bound the value in one place. Messages are written for the person filling in
 * the form, because they surface directly under the input.
 */

export const dbId = z.coerce
  .number({ error: "Select a valid option." })
  .int()
  .positive("Select a valid option.");

export const optionalDbId = z
  .union([dbId, z.literal("")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

export function requiredText(label: string, max = 160, min = 1) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(min, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);
}

export function optionalText(max = 160) {
  return z
    .string()
    .trim()
    .max(max, `Must be ${max} characters or fewer.`)
    .optional()
    .transform((value) => (value ? value : null));
}

export function wholeNumber(
  label: string,
  { min = 0, max = 10_000_000 }: { min?: number; max?: number } = {},
) {
  return z.coerce
    .number({ error: `${label} must be a number.` })
    .int(`${label} must be a whole number.`)
    .min(min, `${label} cannot be less than ${min}.`)
    .max(max, `${label} cannot be greater than ${max.toLocaleString("en-US")}.`);
}

export function decimal(
  label: string,
  { min = 0, max = 1_000_000 }: { min?: number; max?: number } = {},
) {
  return z.coerce
    .number({ error: `${label} must be a number.` })
    .min(min, `${label} cannot be less than ${min}.`)
    .max(max, `${label} cannot be greater than ${max.toLocaleString("en-US")}.`);
}

export function percentage(label: string) {
  return decimal(label, { min: 0, max: 100 });
}

/**
 * Money arrives as "1,240.50" or "₵1,240.50" and is stored as whole pesewas.
 * Rounding here keeps a stray third decimal from silently truncating.
 */
export function moneyCents(
  label: string,
  { min = 0, max = 100_000_000 }: { min?: number; max?: number } = {},
) {
  return z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .transform((value, ctx) => {
      const cleaned = stripCurrency(value);

      // `Number` would also take "1e3", "0x10" and "Infinity" — none of which
      // anyone means to type into a money field, and all of which would be
      // read as an amount nobody entered.
      if (!/^-?\d*\.?\d+$/.test(cleaned)) {
        ctx.addIssue({ code: "custom", message: `${label} must be an amount.` });
        return z.NEVER;
      }

      /*
       * Converted digit by digit rather than as `Math.round(amount * 100)`.
       * Scaling a float loses the very case this is meant to catch: 1.005
       * becomes 100.49999999999999 and rounds down to 100, silently dropping
       * the pesewa the comment above promises to keep.
       */
      const parts = /^(-?)(\d*)(?:\.(\d+))?$/.exec(cleaned);
      if (!parts) {
        ctx.addIssue({ code: "custom", message: `${label} must be an amount.` });
        return z.NEVER;
      }

      const [, sign, whole, fraction = ""] = parts;
      // A third digit is kept only to decide the rounding of the second.
      const digits = `${fraction}000`.slice(0, 3);
      const magnitude =
        Number(whole || "0") * 100 +
        Number(digits.slice(0, 2)) +
        (Number(digits[2]) >= 5 ? 1 : 0);

      if (!Number.isSafeInteger(magnitude)) {
        ctx.addIssue({ code: "custom", message: `${label} is too large.` });
        return z.NEVER;
      }

      const cents = sign === "-" ? -magnitude : magnitude;
      if (cents < min) {
        ctx.addIssue({
          code: "custom",
          message: `${label} cannot be less than ${(min / 100).toFixed(2)}.`,
        });
        return z.NEVER;
      }
      if (cents > max) {
        ctx.addIssue({ code: "custom", message: `${label} is too large.` });
        return z.NEVER;
      }

      return cents;
    });
}

/** `<input type="date">` posts `YYYY-MM-DD`; the column stores the same. */
export const isoDate = z
  .string({ error: "Pick a date." })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Pick a valid date.");

export const optionalIsoDate = z
  .union([isoDate, z.literal("")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

/** `<input type="time">` posts `HH:MM`, occasionally `HH:MM:SS`. */
export const isoTime = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use a valid time, e.g. 08:30");

export const optionalIsoTime = z
  .union([isoTime, z.literal("")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

/** `<input type="datetime-local">` posts `YYYY-MM-DDTHH:MM`. */
export const optionalDateTime = z
  .union([
    z
      .string()
      .trim()
      .regex(
        /^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        "Pick a valid date and time.",
      ),
    z.literal(""),
  ])
  .optional()
  .transform((value) =>
    value === "" || value === undefined ? null : new Date(value),
  );

export const email = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(255, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

export const optionalEmail = z
  .union([email, z.literal("")])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

/** Deliberately permissive — the farm's contacts use several formats. */
export const optionalPhone = z
  .union([
    z
      .string()
      .trim()
      .min(7, "Phone number looks too short.")
      .max(32, "Phone number looks too long.")
      .regex(/^[+()\d\s-]+$/, "Phone number can only contain digits, spaces, + ( ) -"),
    z.literal(""),
  ])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

/** Unchecked HTML checkboxes are absent from FormData entirely. */
export const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false")])
  .optional()
  .transform((value) => value === "on" || value === "true");

export const idParam = z.object({ id: dbId });

/** Rejects a date more than a day in the future for "what happened" records. */
export const pastOrTodayDate = isoDate.refine((value) => {
  const tomorrow = new Date();
  tomorrow.setHours(23, 59, 59, 999);
  return new Date(`${value}T00:00:00`) <= tomorrow;
}, "The date cannot be in the future.");
