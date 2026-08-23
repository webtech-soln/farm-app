import { z } from "zod";

import {
  checkbox,
  dbId,
  decimal,
  email,
  isoTime,
  moneyCents,
  optionalDateTime,
  optionalDbId,
  optionalEmail,
  optionalIsoDate,
  optionalIsoTime,
  optionalPhone,
  optionalText,
  pastOrTodayDate,
  percentage,
  isoDate,
  requiredText,
  wholeNumber,
} from "./common";

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** Payload of a row-level action fired from a single hidden `id` input. */
export const idSchema = z.object({ id: dbId });

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Password is required." })
    .min(1, "Password is required.")
    .max(200, "Password is too long."),
  remember: checkbox,
  next: optionalText(200),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(200, "Password is too long.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The passwords do not match.",
    path: ["confirmPassword"],
  });

/* -------------------------------------------------------------------------- */
/* Houses & flocks                                                            */
/* -------------------------------------------------------------------------- */

export const houseSchema = z.object({
  id: optionalDbId,
  code: requiredText("House code", 32)
    .regex(
      /^[a-z0-9-]+$/i,
      "Use letters, numbers and hyphens only, e.g. house-07.",
    )
    .transform((value) => value.toLowerCase()),
  name: requiredText("House name", 80),
  capacity: wholeNumber("Capacity", { min: 1, max: 200_000 }),
  status: z.enum(["healthy", "warning", "brooding", "maintenance", "empty"], {
    error: "Choose a status.",
  }),
  notes: optionalText(500),
});

export const flockSchema = z
  .object({
    id: optionalDbId,
    code: requiredText("Flock ID", 32).regex(
      /^[A-Za-z0-9-]+$/,
      "Use letters, numbers and hyphens only, e.g. JF-2026-009.",
    ),
    houseId: optionalDbId,
    type: z.enum(["broiler", "layer"], { error: "Choose broiler or layer." }),
    breed: requiredText("Breed", 80),
    initialCount: wholeNumber("Initial birds", { min: 1, max: 500_000 }),
    currentCount: wholeNumber("Current birds", { min: 0, max: 500_000 }),
    startedOn: pastOrTodayDate,
    closedOn: optionalIsoDate,
    status: z.enum(["healthy", "warning", "brooding", "treatment", "closed"], {
      error: "Choose a status.",
    }),
    sourceHatchery: optionalText(120),
    notes: optionalText(500),
  })
  .refine((data) => data.currentCount <= data.initialCount, {
    message: "Current birds cannot exceed the initial placement.",
    path: ["currentCount"],
  })
  .refine(
    (data) => !data.closedOn || data.closedOn >= data.startedOn,
    { message: "The close date must fall after the start date.", path: ["closedOn"] },
  )
  .refine((data) => data.status !== "closed" || data.closedOn, {
    message: "A closed flock needs a close date.",
    path: ["closedOn"],
  });

/* -------------------------------------------------------------------------- */
/* Daily operations                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Mirrors the Daily Records board field for field. Bird movements are checked
 * against the opening balance, which is the validation the board's "All
 * required fields complete" strip is asserting.
 */
export const dailyRecordSchema = z
  .object({
    id: optionalDbId,
    houseId: dbId,
    flockId: optionalDbId,
    recordDate: pastOrTodayDate,
    startingBirds: wholeNumber("Starting birds", { min: 0, max: 500_000 }),
    deaths: wholeNumber("Deaths", { max: 500_000 }),
    culls: wholeNumber("Culls", { max: 500_000 }),
    transfersOut: wholeNumber("Transfers out", { max: 500_000 }),
    feedKg: decimal("Feed consumed", { max: 100_000 }).optional(),
    feedType: optionalText(80),
    feedBatch: optionalText(60),
    feedItemId: optionalDbId,
    waterLitres: decimal("Water consumption", { max: 500_000 }).optional(),
    tempMinC: decimal("Minimum temperature", { min: -20, max: 60 }).optional(),
    tempMaxC: decimal("Maximum temperature", { min: -20, max: 60 }).optional(),
    humidityPct: percentage("Humidity").optional(),
    ventilation: optionalText(60),
    eggsCollected: wholeNumber("Eggs collected", { max: 200_000 }).optional(),
    eggsBroken: wholeNumber("Broken eggs", { max: 200_000 }).optional(),
    avgWeightKg: decimal("Average weight", { max: 30 }).optional(),
    sampleSize: wholeNumber("Sample size", { max: 100_000 }).optional(),
    uniformityPct: percentage("Uniformity").optional(),
    notes: optionalText(2000),
    status: z.enum(["draft", "submitted"]).default("draft"),
  })
  .refine(
    (data) =>
      data.deaths + data.culls + data.transfersOut <= data.startingBirds,
    {
      message:
        "Deaths, culls and transfers together cannot exceed the starting birds.",
      path: ["deaths"],
    },
  )
  .refine(
    (data) =>
      data.tempMinC === undefined ||
      data.tempMaxC === undefined ||
      data.tempMinC <= data.tempMaxC,
    {
      message: "Minimum temperature cannot exceed the maximum.",
      path: ["tempMinC"],
    },
  )
  .refine(
    (data) =>
      data.eggsBroken === undefined ||
      data.eggsCollected === undefined ||
      data.eggsBroken <= data.eggsCollected,
    { message: "Broken eggs cannot exceed the eggs collected.", path: ["eggsBroken"] },
  )
  .refine(
    (data) =>
      data.avgWeightKg === undefined ||
      (data.sampleSize !== undefined && data.sampleSize >= 30),
    {
      message: "Sample at least 30 birds for a valid average weight.",
      path: ["sampleSize"],
    },
  );

export const mortalitySchema = z.object({
  id: optionalDbId,
  flockId: dbId,
  houseId: optionalDbId,
  occurredOn: pastOrTodayDate,
  occurredAt: optionalIsoTime,
  deaths: wholeNumber("Deaths", { min: 1, max: 100_000 }),
  cause: requiredText("Cause", 120),
  status: z
    .enum(["pending", "reviewed", "under_treatment", "escalated"])
    .default("pending"),
  notes: optionalText(1000),
});

export const mortalityStatusSchema = z.object({
  id: dbId,
  status: z.enum(["pending", "reviewed", "under_treatment", "escalated"]),
});

export const weightRecordSchema = z.object({
  id: optionalDbId,
  flockId: dbId,
  houseId: optionalDbId,
  recordedOn: pastOrTodayDate,
  ageDays: wholeNumber("Age in days", { max: 1000 }).optional(),
  avgWeightKg: decimal("Average weight", { min: 0.01, max: 30 }),
  standardWeightKg: decimal("Standard weight", { max: 30 }).optional(),
  sampleSize: wholeNumber("Sample size", { min: 30, max: 100_000 }),
  uniformityPct: percentage("Uniformity").optional(),
});

export const eggCollectionSchema = z
  .object({
    id: optionalDbId,
    houseId: dbId,
    flockId: optionalDbId,
    collectedOn: pastOrTodayDate,
    collectedAt: isoTime,
    session: z.enum(["morning", "midday", "evening"], {
      error: "Choose a collection session.",
    }),
    collected: wholeNumber("Eggs collected", { max: 200_000 }),
    broken: wholeNumber("Broken eggs", { max: 200_000 }).default(0),
    gradeA: wholeNumber("Grade A", { max: 200_000 }).default(0),
    gradeB: wholeNumber("Grade B", { max: 200_000 }).default(0),
    rejected: wholeNumber("Rejected", { max: 200_000 }).default(0),
    sizeSmall: wholeNumber("Small", { max: 200_000 }).default(0),
    sizeMedium: wholeNumber("Medium", { max: 200_000 }).default(0),
    sizeLarge: wholeNumber("Large", { max: 200_000 }).default(0),
    sizeExtraLarge: wholeNumber("Extra large", { max: 200_000 }).default(0),
    status: z
      .enum(["pending_sync", "synced", "needs_review"])
      .default("synced"),
  })
  .refine((data) => data.broken <= data.collected, {
    message: "Broken eggs cannot exceed the eggs collected.",
    path: ["broken"],
  })
  .refine(
    (data) => data.gradeA + data.gradeB + data.rejected <= data.collected,
    {
      message: "Grade A, B and rejected together cannot exceed the collection.",
      path: ["gradeA"],
    },
  );

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export const healthEventSchema = z.object({
  id: optionalDbId,
  flockId: dbId,
  houseId: optionalDbId,
  occurredOn: pastOrTodayDate,
  condition: requiredText("Condition", 120),
  cases: wholeNumber("Cases", { min: 1, max: 500_000 }),
  treatment: optionalText(160),
  status: z
    .enum(["escalated", "in_treatment", "monitoring", "resolved"])
    .default("monitoring"),
  resolvedOn: optionalIsoDate,
  notes: optionalText(1000),
});

export const vaccinationSchema = z.object({
  id: optionalDbId,
  flockId: optionalDbId,
  houseId: optionalDbId,
  vaccine: requiredText("Vaccine", 120),
  route: requiredText("Route", 80),
  scheduledOn: isoDate,
  scheduledAt: optionalIsoTime,
  administeredAt: optionalDateTime,
  administeredById: optionalDbId,
  doses: wholeNumber("Doses", { min: 1, max: 1_000_000 }),
  status: z
    .enum(["scheduled", "completed", "overdue", "cancelled"])
    .default("scheduled"),
  notes: optionalText(1000),
});

/** Closing out a health event from the board's row menu. */
export const healthResolveSchema = z.object({
  id: dbId,
  resolvedOn: pastOrTodayDate,
  notes: optionalText(1000),
});

/** Marking a scheduled dose as given. */
export const vaccinationCompleteSchema = z.object({
  id: dbId,
  administeredAt: optionalDateTime,
  doses: wholeNumber("Doses", { min: 1, max: 1_000_000 }).optional(),
  notes: optionalText(1000),
});

/* -------------------------------------------------------------------------- */
/* Suppliers & inventory                                                      */
/* -------------------------------------------------------------------------- */

export const supplierSchema = z.object({
  id: optionalDbId,
  name: requiredText("Supplier name", 160),
  location: optionalText(160),
  category: optionalText(80),
  contact: optionalPhone,
  email: optionalEmail,
  status: z.enum(["active", "inactive", "overdue"]).default("active"),
  outstandingCents: moneyCents("Outstanding balance").optional().default(0),
  notes: optionalText(1000),
});

export const inventoryItemSchema = z.object({
  id: optionalDbId,
  sku: requiredText("SKU", 40).regex(
    /^[A-Za-z0-9-]+$/,
    "Use letters, numbers and hyphens only, e.g. FD-1182.",
  ),
  name: requiredText("Item name", 160),
  category: z.enum(
    ["feed", "medicine", "equipment", "packaging", "consumable", "other"],
    { error: "Choose a category." },
  ),
  subcategory: optionalText(60),
  quantity: decimal("Quantity", { max: 10_000_000 }),
  unit: requiredText("Unit", 24),
  unitCostCents: moneyCents("Unit cost"),
  minStock: decimal("Minimum stock", { max: 10_000_000 }).default(0),
  batch: optionalText(60),
  expiryDate: optionalIsoDate,
  supplierId: optionalDbId,
});

export const stockMovementSchema = z.object({
  itemId: dbId,
  type: z.enum(["stock_in", "stock_out", "adjustment"], {
    error: "Choose a movement type.",
  }),
  quantity: decimal("Quantity", { min: 0.001, max: 10_000_000 }),
  unitCostCents: moneyCents("Unit cost").optional(),
  occurredOn: pastOrTodayDate,
  reference: optionalText(80),
  note: optionalText(500),
});

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export const productSchema = z.object({
  id: optionalDbId,
  name: requiredText("Product name", 120),
  category: requiredText("Category", 60),
  icon: z
    .enum(["package", "egg", "bird", "sprout", "layers", "beef"])
    .default("package"),
  priceCents: moneyCents("Price", { min: 1 }),
  costCents: moneyCents("Unit cost").optional().default(0),
  unit: requiredText("Unit", 40),
  availableQty: decimal("Available quantity", { max: 10_000_000 }).default(0),
  availableUnit: optionalText(40),
  note: optionalText(80),
});

export const customerSchema = z.object({
  id: optionalDbId,
  name: requiredText("Customer name", 160),
  type: z.enum(["wholesaler", "retailer", "restaurant", "walk_in"], {
    error: "Choose a customer type.",
  }),
  location: optionalText(120),
  phone: optionalPhone,
  email: optionalEmail,
  status: z.enum(["active", "dormant", "overdue"]).default("active"),
  creditLimitCents: moneyCents("Credit limit").optional(),
  notes: optionalText(1000),
});

/**
 * Order lines arrive as a JSON string in a hidden input, because a repeated
 * set of `<input name="items[]">` pairs cannot express the line/product
 * relationship reliably through `FormData`.
 */
const orderLine = z.object({
  productId: dbId,
  quantity: decimal("Quantity", { min: 0.001, max: 1_000_000 }),
});

export const orderSchema = z.object({
  id: optionalDbId,
  customerId: dbId,
  deliveryMethod: z
    .enum(["own_fleet", "pickup", "third_party"])
    .default("own_fleet"),
  status: z
    .enum([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "in_transit",
      "delivered",
      "cancelled",
    ])
    .default("pending"),
  deliveryFeeCents: moneyCents("Delivery fee").optional().default(0),
  notes: optionalText(1000),
  items: z
    .string({ error: "Add at least one item." })
    .transform((value, ctx) => {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "The order items are malformed." });
        return z.NEVER;
      }
    })
    .pipe(
      z
        .array(orderLine)
        .min(1, "Add at least one item to the order.")
        .max(50, "An order can hold at most 50 lines."),
    ),
});

export const orderStatusSchema = z.object({
  id: dbId,
  status: z.enum([
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "in_transit",
    "delivered",
    "cancelled",
  ]),
});

export const paymentSchema = z.object({
  orderId: optionalDbId,
  customerId: optionalDbId,
  amountCents: moneyCents("Amount", { min: 1 }),
  method: z
    .enum(["bank_transfer", "cash", "card", "mobile_money", "cheque", "part_cash"])
    .default("bank_transfer"),
  receivedOn: pastOrTodayDate,
  reference: optionalText(60),
  description: optionalText(200),
});

export const deliverySchema = z.object({
  id: optionalDbId,
  orderId: dbId,
  driverId: optionalDbId,
  destination: requiredText("Destination", 160),
  routeName: optionalText(80),
  scheduledOn: isoDate,
  windowStart: optionalIsoTime,
  windowEnd: optionalIsoTime,
  status: z
    .enum(["scheduled", "preparing", "in_transit", "delivered", "failed"])
    .default("scheduled"),
  weightKg: decimal("Weight", { max: 100_000 }).optional(),
  notes: optionalText(1000),
});

export const deliveryStatusSchema = z.object({
  id: dbId,
  status: z.enum(["scheduled", "preparing", "in_transit", "delivered", "failed"]),
  notes: optionalText(1000),
});

/* -------------------------------------------------------------------------- */
/* Finance                                                                    */
/* -------------------------------------------------------------------------- */

export const expenseSchema = z.object({
  id: optionalDbId,
  expenseDate: pastOrTodayDate,
  description: requiredText("Description", 200),
  category: z.enum(
    ["feed", "labour", "medicine", "utilities", "transport", "maintenance", "other"],
    { error: "Choose a category." },
  ),
  amountCents: moneyCents("Amount", { min: 1 }),
  supplierId: optionalDbId,
  method: z
    .enum(["bank_transfer", "cash", "card", "mobile_money", "cheque", "part_cash"])
    .default("bank_transfer"),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  notes: optionalText(1000),
});

export const expenseStatusSchema = z.object({
  id: dbId,
  status: z.enum(["pending", "approved", "rejected"]),
});

/* -------------------------------------------------------------------------- */
/* People & work                                                              */
/* -------------------------------------------------------------------------- */

export const userSchema = z
  .object({
    id: optionalDbId,
    name: requiredText("Full name", 120),
    email,
    role: z.enum(
      ["owner", "manager", "supervisor", "attendant", "vet", "sales", "driver"],
      { error: "Choose a role." },
    ),
    jobTitle: optionalText(120),
    phone: optionalPhone,
    assignedArea: optionalText(160),
    dutyStatus: z
      .enum(["on_duty", "visiting", "on_road", "on_leave", "off_duty"])
      .default("on_duty"),
    joinedOn: optionalIsoDate,
    attendancePct: percentage("Attendance").optional(),
    isContractor: checkbox,
    isActive: checkbox.default(true),
    /** Only required when creating an account that can sign in. */
    password: z
      .union([
        z
          .string()
          .min(10, "Use at least 10 characters.")
          .max(200, "Password is too long."),
        z.literal(""),
      ])
      .optional()
      .transform((value) => (value ? value : null)),
  })
  .refine((data) => data.id !== null || data.password !== null, {
    message: "Set an initial password for the new user.",
    path: ["password"],
  });

export const taskSchema = z.object({
  id: optionalDbId,
  title: requiredText("Task title", 160),
  detail: optionalText(240),
  priority: z.enum(["high", "medium", "low"], { error: "Choose a priority." }),
  status: z.enum(["pending", "in_progress", "completed"]).default("pending"),
  contextLabel: optionalText(80),
  assigneeId: optionalDbId,
  dueAt: optionalDateTime,
});

export const taskStatusSchema = z.object({
  id: dbId,
  status: z.enum(["pending", "in_progress", "completed"]),
});

/* -------------------------------------------------------------------------- */
/* System                                                                     */
/* -------------------------------------------------------------------------- */

export const notificationPreferenceSchema = z.object({
  channel: z.enum(["In-app", "Email", "SMS", "WhatsApp"], {
    error: "Unknown channel.",
  }),
  scope: requiredText("Scope", 80),
  enabled: checkbox,
});

export const reportRequestSchema = z.object({
  reportKey: requiredText("Report", 60),
  name: requiredText("Report name", 120),
  format: z.enum(["pdf", "excel", "csv"], { error: "Choose a format." }),
  periodStart: optionalIsoDate,
  periodEnd: optionalIsoDate,
  periodLabel: optionalText(80),
});

export const farmProfileSchema = z.object({
  farmName: requiredText("Farm name", 160),
  registeredName: optionalText(160),
  estateName: optionalText(160),
  address: optionalText(240),
  cityState: optionalText(160),
  country: optionalText(80),
  timezone: optionalText(80),
  currency: optionalText(16),
});

export const unitSettingsSchema = z.object({
  weightUnit: requiredText("Weight unit", 32),
  temperatureUnit: requiredText("Temperature unit", 32),
  volumeUnit: requiredText("Volume unit", 32),
  dateFormat: requiredText("Date format", 32),
});

export const thresholdSettingsSchema = z
  .object({
    dailyMortalityAlertPct: percentage("Daily mortality alert"),
    weeklyMortalityAlertPct: percentage("Weekly mortality alert"),
    minProductionRatePct: percentage("Minimum production rate"),
    feedMinimumStockKg: decimal("Feed minimum stock", { max: 1_000_000 }),
    medicineExpiryWarningDays: wholeNumber("Medicine expiry warning", {
      min: 1,
      max: 365,
    }),
    temperatureMinC: decimal("Minimum temperature", { min: -20, max: 60 }),
    temperatureMaxC: decimal("Maximum temperature", { min: -20, max: 60 }),
    escalateCriticalAlerts: checkbox,
    blockAnomalousRecords: checkbox,
    autoPurchaseSuggestions: checkbox,
  })
  .refine((data) => data.temperatureMinC < data.temperatureMaxC, {
    message: "The minimum temperature must be below the maximum.",
    path: ["temperatureMinC"],
  })
  .refine(
    (data) => data.dailyMortalityAlertPct <= data.weeklyMortalityAlertPct,
    {
      message: "The daily threshold should not exceed the weekly threshold.",
      path: ["dailyMortalityAlertPct"],
    },
  );

export type HouseInput = z.output<typeof houseSchema>;
export type FlockInput = z.output<typeof flockSchema>;
export type DailyRecordInput = z.output<typeof dailyRecordSchema>;
export type OrderInput = z.output<typeof orderSchema>;
export type TaskInput = z.output<typeof taskSchema>;
export type UserInput = z.output<typeof userSchema>;
