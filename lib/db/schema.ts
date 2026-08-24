import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  time,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Money is stored as whole cents in `integer` columns (suffixed `_cents`) so
 * arithmetic never touches a float. Weights, temperatures and percentages use
 * `doublePrecision` — they are measurements, not currency.
 */

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

export const userRole = pgEnum("user_role", [
  "owner",
  "manager",
  "supervisor",
  "attendant",
  "vet",
  "sales",
  "driver",
]);

export const dutyStatus = pgEnum("duty_status", [
  "on_duty",
  "visiting",
  "on_road",
  "on_leave",
  "off_duty",
]);

export const houseStatus = pgEnum("house_status", [
  "healthy",
  "warning",
  "brooding",
  "maintenance",
  "empty",
]);

export const flockType = pgEnum("flock_type", ["broiler", "layer"]);

export const flockStatus = pgEnum("flock_status", [
  "healthy",
  "warning",
  "brooding",
  "treatment",
  "closed",
]);

export const recordStatus = pgEnum("record_status", ["draft", "submitted"]);

export const mortalityStatus = pgEnum("mortality_status", [
  "pending",
  "reviewed",
  "under_treatment",
  "escalated",
]);

export const healthStatus = pgEnum("health_status", [
  "escalated",
  "in_treatment",
  "monitoring",
  "resolved",
]);

export const vaccinationStatus = pgEnum("vaccination_status", [
  "scheduled",
  "completed",
  "overdue",
  "cancelled",
]);

export const eggSession = pgEnum("egg_session", [
  "morning",
  "midday",
  "evening",
]);

export const collectionStatus = pgEnum("collection_status", [
  "pending_sync",
  "synced",
  "needs_review",
]);

export const inventoryCategory = pgEnum("inventory_category", [
  "feed",
  "medicine",
  "equipment",
  "packaging",
  "consumable",
  "other",
]);

export const movementType = pgEnum("movement_type", [
  "stock_in",
  "stock_out",
  "adjustment",
]);

export const supplierStatus = pgEnum("supplier_status", [
  "active",
  "inactive",
  "overdue",
]);

export const productStatus = pgEnum("product_status", [
  "in_stock",
  "low_stock",
  "out_of_stock",
]);

export const customerType = pgEnum("customer_type", [
  "wholesaler",
  "retailer",
  "restaurant",
  "walk_in",
]);

export const customerStatus = pgEnum("customer_status", [
  "active",
  "dormant",
  "overdue",
]);

export const orderStatus = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "in_transit",
  "delivered",
  "cancelled",
]);

export const paymentStatus = pgEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
  "refunded",
]);

export const paymentMethod = pgEnum("payment_method", [
  "bank_transfer",
  "cash",
  "card",
  "mobile_money",
  "cheque",
  "part_cash",
]);

export const deliveryMethod = pgEnum("delivery_method", [
  "own_fleet",
  "pickup",
  "third_party",
]);

export const deliveryStatus = pgEnum("delivery_status", [
  "scheduled",
  "preparing",
  "in_transit",
  "delivered",
  "failed",
]);

export const orderEventKind = pgEnum("order_event_kind", [
  "placed",
  "payment",
  "packed",
  "transit",
  "delivered",
  "cancelled",
]);

export const expenseCategory = pgEnum("expense_category", [
  "feed",
  "labour",
  "medicine",
  "utilities",
  "transport",
  "maintenance",
  "other",
]);

export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const taskStatus = pgEnum("task_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const taskPriority = pgEnum("task_priority", ["high", "medium", "low"]);

export const notificationCategory = pgEnum("notification_category", [
  "health",
  "inventory",
  "tasks",
  "finance",
  "sales",
  "system",
]);

export const toneEnum = pgEnum("tone", [
  "violet",
  "success",
  "warning",
  "error",
  "info",
  "neutral",
]);

export const reportFormat = pgEnum("report_format", ["pdf", "excel", "csv"]);

export const reportStatus = pgEnum("report_status", [
  "queued",
  "generating",
  "ready",
  "failed",
]);

export const reportOrigin = pgEnum("report_origin", ["manual", "scheduled"]);

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash"),
    role: userRole("role").notNull().default("attendant"),
    jobTitle: varchar("job_title", { length: 120 }),
    phone: varchar("phone", { length: 32 }),
    assignedArea: varchar("assigned_area", { length: 160 }),
    attendancePct: doublePrecision("attendance_pct"),
    dutyStatus: dutyStatus("duty_status").notNull().default("on_duty"),
    joinedOn: date("joined_on"),
    isContractor: boolean("is_contractor").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    index("users_role_idx").on(table.role),
  ],
);

/**
 * Only the SHA-256 of the session token is persisted, so a database leak does
 * not hand out live sessions.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userAgent: varchar("user_agent", { length: 400 }),
    ipAddress: varchar("ip_address", { length: 64 }),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expiresAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Farm configuration                                                         */
/* -------------------------------------------------------------------------- */

/** Single-row table backing the Settings board. */
export const farmSettings = pgTable("farm_settings", {
  id: integer("id").primaryKey().default(1),
  farmName: varchar("farm_name", { length: 160 }).notNull(),
  registeredName: varchar("registered_name", { length: 160 }),
  estateName: varchar("estate_name", { length: 160 }),
  address: varchar("address", { length: 240 }),
  cityState: varchar("city_state", { length: 160 }),
  country: varchar("country", { length: 80 }),
  timezone: varchar("timezone", { length: 80 }),
  currency: varchar("currency", { length: 16 }),
  weightUnit: varchar("weight_unit", { length: 32 }),
  temperatureUnit: varchar("temperature_unit", { length: 32 }),
  volumeUnit: varchar("volume_unit", { length: 32 }),
  dateFormat: varchar("date_format", { length: 32 }),
  dailyMortalityAlertPct: doublePrecision("daily_mortality_alert_pct")
    .notNull()
    .default(0.4),
  weeklyMortalityAlertPct: doublePrecision("weekly_mortality_alert_pct")
    .notNull()
    .default(2),
  minProductionRatePct: doublePrecision("min_production_rate_pct")
    .notNull()
    .default(82),
  feedMinimumStockKg: doublePrecision("feed_minimum_stock_kg")
    .notNull()
    .default(1000),
  medicineExpiryWarningDays: integer("medicine_expiry_warning_days")
    .notNull()
    .default(30),
  temperatureMinC: doublePrecision("temperature_min_c").notNull().default(24),
  temperatureMaxC: doublePrecision("temperature_max_c").notNull().default(30),
  escalateCriticalAlerts: boolean("escalate_critical_alerts")
    .notNull()
    .default(true),
  blockAnomalousRecords: boolean("block_anomalous_records")
    .notNull()
    .default(true),
  autoPurchaseSuggestions: boolean("auto_purchase_suggestions")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Houses & flocks                                                            */
/* -------------------------------------------------------------------------- */

export const houses = pgTable(
  "houses",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    name: varchar("name", { length: 80 }).notNull(),
    capacity: integer("capacity").notNull(),
    status: houseStatus("status").notNull().default("healthy"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("houses_code_unique").on(table.code)],
);

export const flocks = pgTable(
  "flocks",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 32 }).notNull(),
    houseId: integer("house_id").references(() => houses.id, {
      onDelete: "set null",
    }),
    type: flockType("type").notNull(),
    breed: varchar("breed", { length: 80 }).notNull(),
    initialCount: integer("initial_count").notNull(),
    currentCount: integer("current_count").notNull(),
    startedOn: date("started_on").notNull(),
    closedOn: date("closed_on"),
    status: flockStatus("status").notNull().default("healthy"),
    sourceHatchery: varchar("source_hatchery", { length: 120 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("flocks_code_unique").on(table.code),
    index("flocks_house_idx").on(table.houseId),
    index("flocks_status_idx").on(table.status),
  ],
);

/** Hourly-ish environment readings, used by the house temperature charts. */
export const houseReadings = pgTable(
  "house_readings",
  {
    id: serial("id").primaryKey(),
    houseId: integer("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull(),
    temperatureC: doublePrecision("temperature_c").notNull(),
    humidityPct: doublePrecision("humidity_pct"),
  },
  (table) => [index("house_readings_house_time_idx").on(table.houseId, table.recordedAt)],
);

/* -------------------------------------------------------------------------- */
/* Daily operations                                                           */
/* -------------------------------------------------------------------------- */

export const dailyRecords = pgTable(
  "daily_records",
  {
    id: serial("id").primaryKey(),
    houseId: integer("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    flockId: integer("flock_id").references(() => flocks.id, {
      onDelete: "set null",
    }),
    recordDate: date("record_date").notNull(),
    startingBirds: integer("starting_birds").notNull(),
    deaths: integer("deaths").notNull().default(0),
    culls: integer("culls").notNull().default(0),
    transfersOut: integer("transfers_out").notNull().default(0),
    closingBirds: integer("closing_birds").notNull(),
    feedKg: doublePrecision("feed_kg"),
    feedType: varchar("feed_type", { length: 80 }),
    feedBatch: varchar("feed_batch", { length: 60 }),
    feedItemId: integer("feed_item_id"),
    waterLitres: doublePrecision("water_litres"),
    tempMinC: doublePrecision("temp_min_c"),
    tempMaxC: doublePrecision("temp_max_c"),
    humidityPct: doublePrecision("humidity_pct"),
    ventilation: varchar("ventilation", { length: 60 }),
    eggsCollected: integer("eggs_collected"),
    eggsBroken: integer("eggs_broken"),
    avgWeightKg: doublePrecision("avg_weight_kg"),
    sampleSize: integer("sample_size"),
    uniformityPct: doublePrecision("uniformity_pct"),
    notes: text("notes"),
    status: recordStatus("status").notNull().default("draft"),
    recordedById: integer("recorded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_records_house_date_unique").on(
      table.houseId,
      table.recordDate,
    ),
    index("daily_records_date_idx").on(table.recordDate),
    index("daily_records_flock_idx").on(table.flockId),
  ],
);

export const mortalityRecords = pgTable(
  "mortality_records",
  {
    id: serial("id").primaryKey(),
    flockId: integer("flock_id")
      .notNull()
      .references(() => flocks.id, { onDelete: "cascade" }),
    houseId: integer("house_id").references(() => houses.id, {
      onDelete: "set null",
    }),
    occurredOn: date("occurred_on").notNull(),
    occurredAt: time("occurred_at"),
    deaths: integer("deaths").notNull(),
    cause: varchar("cause", { length: 120 }).notNull(),
    status: mortalityStatus("status").notNull().default("pending"),
    notes: text("notes"),
    recordedById: integer("recorded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("mortality_flock_idx").on(table.flockId),
    index("mortality_date_idx").on(table.occurredOn),
  ],
);

export const weightRecords = pgTable(
  "weight_records",
  {
    id: serial("id").primaryKey(),
    flockId: integer("flock_id")
      .notNull()
      .references(() => flocks.id, { onDelete: "cascade" }),
    houseId: integer("house_id").references(() => houses.id, {
      onDelete: "set null",
    }),
    recordedOn: date("recorded_on").notNull(),
    ageDays: integer("age_days"),
    avgWeightKg: doublePrecision("avg_weight_kg").notNull(),
    standardWeightKg: doublePrecision("standard_weight_kg"),
    sampleSize: integer("sample_size").notNull(),
    uniformityPct: doublePrecision("uniformity_pct"),
    recordedById: integer("recorded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("weight_flock_idx").on(table.flockId),
    index("weight_date_idx").on(table.recordedOn),
  ],
);

export const eggCollections = pgTable(
  "egg_collections",
  {
    id: serial("id").primaryKey(),
    houseId: integer("house_id")
      .notNull()
      .references(() => houses.id, { onDelete: "cascade" }),
    flockId: integer("flock_id").references(() => flocks.id, {
      onDelete: "set null",
    }),
    collectedOn: date("collected_on").notNull(),
    collectedAt: time("collected_at").notNull(),
    session: eggSession("session").notNull(),
    collected: integer("collected").notNull(),
    broken: integer("broken").notNull().default(0),
    gradeA: integer("grade_a").notNull().default(0),
    gradeB: integer("grade_b").notNull().default(0),
    rejected: integer("rejected").notNull().default(0),
    sizeSmall: integer("size_small").notNull().default(0),
    sizeMedium: integer("size_medium").notNull().default(0),
    sizeLarge: integer("size_large").notNull().default(0),
    sizeExtraLarge: integer("size_extra_large").notNull().default(0),
    status: collectionStatus("status").notNull().default("synced"),
    recordedById: integer("recorded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("egg_collections_date_idx").on(table.collectedOn),
    index("egg_collections_house_idx").on(table.houseId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Health                                                                     */
/* -------------------------------------------------------------------------- */

export const healthEvents = pgTable(
  "health_events",
  {
    id: serial("id").primaryKey(),
    flockId: integer("flock_id")
      .notNull()
      .references(() => flocks.id, { onDelete: "cascade" }),
    houseId: integer("house_id").references(() => houses.id, {
      onDelete: "set null",
    }),
    occurredOn: date("occurred_on").notNull(),
    condition: varchar("condition", { length: 120 }).notNull(),
    cases: integer("cases").notNull(),
    treatment: varchar("treatment", { length: 160 }),
    status: healthStatus("status").notNull().default("monitoring"),
    notes: text("notes"),
    reportedById: integer("reported_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedOn: date("resolved_on"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("health_events_flock_idx").on(table.flockId),
    index("health_events_date_idx").on(table.occurredOn),
  ],
);

export const vaccinations = pgTable(
  "vaccinations",
  {
    id: serial("id").primaryKey(),
    /** Null means the schedule covers every active flock. */
    flockId: integer("flock_id").references(() => flocks.id, {
      onDelete: "cascade",
    }),
    houseId: integer("house_id").references(() => houses.id, {
      onDelete: "set null",
    }),
    vaccine: varchar("vaccine", { length: 120 }).notNull(),
    route: varchar("route", { length: 80 }).notNull(),
    scheduledOn: date("scheduled_on").notNull(),
    scheduledAt: time("scheduled_at"),
    administeredAt: timestamp("administered_at", { withTimezone: true }),
    administeredById: integer("administered_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    doses: integer("doses").notNull(),
    status: vaccinationStatus("status").notNull().default("scheduled"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("vaccinations_scheduled_idx").on(table.scheduledOn),
    index("vaccinations_flock_idx").on(table.flockId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Suppliers & inventory                                                      */
/* -------------------------------------------------------------------------- */

export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    location: varchar("location", { length: 160 }),
    category: varchar("category", { length: 80 }),
    contact: varchar("contact", { length: 60 }),
    email: varchar("email", { length: 255 }),
    status: supplierStatus("status").notNull().default("active"),
    outstandingCents: integer("outstanding_cents").notNull().default(0),
    overdueDays: integer("overdue_days"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("suppliers_name_unique").on(sql`lower(${table.name})`)],
);

/**
 * One stock ledger for everything the farm holds. The Inventory, Feed and
 * Medicines boards are all filtered views over this table, which keeps the
 * quantity of a batch in exactly one place.
 */
export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: serial("id").primaryKey(),
    sku: varchar("sku", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    category: inventoryCategory("category").notNull(),
    /** Feed class ("Broiler", "Layer") or medicine class ("Vaccine"). */
    subcategory: varchar("subcategory", { length: 60 }),
    quantity: doublePrecision("quantity").notNull().default(0),
    unit: varchar("unit", { length: 24 }).notNull(),
    unitCostCents: integer("unit_cost_cents").notNull().default(0),
    minStock: doublePrecision("min_stock").notNull().default(0),
    batch: varchar("batch", { length: 60 }),
    expiryDate: date("expiry_date"),
    supplierId: integer("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("inventory_items_sku_unique").on(table.sku),
    index("inventory_items_category_idx").on(table.category),
  ],
);

export const inventoryMovements = pgTable(
  "inventory_movements",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    type: movementType("type").notNull(),
    /** Always positive; `type` carries the direction. */
    quantity: doublePrecision("quantity").notNull(),
    unitCostCents: integer("unit_cost_cents"),
    occurredOn: date("occurred_on").notNull(),
    reference: varchar("reference", { length: 80 }),
    note: text("note"),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("inventory_movements_item_idx").on(table.itemId),
    index("inventory_movements_date_idx").on(table.occurredOn),
  ],
);

/* -------------------------------------------------------------------------- */
/* Sales                                                                      */
/* -------------------------------------------------------------------------- */

export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    icon: varchar("icon", { length: 40 }).notNull().default("package"),
    priceCents: integer("price_cents").notNull(),
    costCents: integer("cost_cents").notNull().default(0),
    unit: varchar("unit", { length: 40 }).notNull(),
    availableQty: doublePrecision("available_qty").notNull().default(0),
    availableUnit: varchar("available_unit", { length: 40 }),
    status: productStatus("status").notNull().default("in_stock"),
    note: varchar("note", { length: 80 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("products_name_unique").on(sql`lower(${table.name})`)],
);

export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    type: customerType("type").notNull(),
    location: varchar("location", { length: 120 }),
    phone: varchar("phone", { length: 32 }),
    email: varchar("email", { length: 255 }),
    status: customerStatus("status").notNull().default("active"),
    creditLimitCents: integer("credit_limit_cents"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("customers_name_unique").on(sql`lower(${table.name})`)],
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 32 }).notNull(),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    placedAt: timestamp("placed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: orderStatus("status").notNull().default("pending"),
    paymentStatus: paymentStatus("payment_status").notNull().default("unpaid"),
    deliveryMethod: deliveryMethod("delivery_method")
      .notNull()
      .default("own_fleet"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    deliveryFeeCents: integer("delivery_fee_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    notes: text("notes"),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("orders_reference_unique").on(table.reference),
    index("orders_customer_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_placed_idx").on(table.placedAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 120 }).notNull(),
    quantity: doublePrecision("quantity").notNull(),
    unit: varchar("unit", { length: 40 }),
    unitPriceCents: integer("unit_price_cents").notNull(),
    lineTotalCents: integer("line_total_cents").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const orderEvents = pgTable(
  "order_events",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    kind: orderEventKind("kind").notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [index("order_events_order_idx").on(table.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id").references(() => orders.id, {
      onDelete: "cascade",
    }),
    customerId: integer("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    amountCents: integer("amount_cents").notNull(),
    method: paymentMethod("method").notNull().default("bank_transfer"),
    receivedOn: date("received_on").notNull(),
    reference: varchar("reference", { length: 60 }),
    description: varchar("description", { length: 200 }),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_order_idx").on(table.orderId),
    index("payments_date_idx").on(table.receivedOn),
  ],
);

export const deliveries = pgTable(
  "deliveries",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    driverId: integer("driver_id").references(() => users.id, {
      onDelete: "set null",
    }),
    destination: varchar("destination", { length: 160 }).notNull(),
    routeName: varchar("route_name", { length: 80 }),
    scheduledOn: date("scheduled_on").notNull(),
    windowStart: time("window_start"),
    windowEnd: time("window_end"),
    status: deliveryStatus("status").notNull().default("scheduled"),
    weightKg: doublePrecision("weight_kg"),
    attempts: integer("attempts").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("deliveries_order_idx").on(table.orderId),
    index("deliveries_date_idx").on(table.scheduledOn),
    index("deliveries_driver_idx").on(table.driverId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Finance                                                                    */
/* -------------------------------------------------------------------------- */

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    expenseDate: date("expense_date").notNull(),
    description: varchar("description", { length: 200 }).notNull(),
    category: expenseCategory("category").notNull(),
    amountCents: integer("amount_cents").notNull(),
    supplierId: integer("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    method: paymentMethod("method").notNull().default("bank_transfer"),
    status: approvalStatus("status").notNull().default("pending"),
    notes: text("notes"),
    recordedById: integer("recorded_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("expenses_date_idx").on(table.expenseDate),
    index("expenses_category_idx").on(table.category),
  ],
);

/* -------------------------------------------------------------------------- */
/* Work management                                                            */
/* -------------------------------------------------------------------------- */

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 160 }).notNull(),
    detail: varchar("detail", { length: 240 }),
    priority: taskPriority("priority").notNull().default("medium"),
    status: taskStatus("status").notNull().default("pending"),
    contextLabel: varchar("context_label", { length: 80 }),
    assigneeId: integer("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdById: integer("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("tasks_status_idx").on(table.status),
    index("tasks_assignee_idx").on(table.assigneeId),
    index("tasks_due_idx").on(table.dueAt),
  ],
);

/* -------------------------------------------------------------------------- */
/* Notifications & reports                                                    */
/* -------------------------------------------------------------------------- */

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    /** Null broadcasts the notification to every user. */
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    category: notificationCategory("category").notNull(),
    tone: toneEnum("tone").notNull().default("info"),
    icon: varchar("icon", { length: 40 }).notNull().default("alert"),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    linkLabel: varchar("link_label", { length: 80 }),
    linkHref: varchar("link_href", { length: 200 }),
    actionLabel: varchar("action_label", { length: 60 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_created_idx").on(table.createdAt),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 40 }).notNull(),
    scope: varchar("scope", { length: 80 }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (table) => [
    uniqueIndex("notification_prefs_user_channel_unique").on(
      table.userId,
      table.channel,
    ),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    reportKey: varchar("report_key", { length: 60 }).notNull(),
    origin: reportOrigin("origin").notNull().default("manual"),
    scheduleLabel: varchar("schedule_label", { length: 60 }),
    periodStart: date("period_start"),
    periodEnd: date("period_end"),
    periodLabel: varchar("period_label", { length: 80 }),
    format: reportFormat("format").notNull().default("pdf"),
    sizeBytes: integer("size_bytes"),
    status: reportStatus("status").notNull().default("ready"),
    generatedById: integer("generated_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("reports_generated_idx").on(table.generatedAt)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  tasks: many(tasks),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

/**
 * Every sign-in attempt that failed, kept just long enough to throttle on.
 *
 * In the database rather than in memory on purpose: an in-process counter
 * forgets everything on deploy, and stops working the moment a second instance
 * exists — both of which are exactly when someone would be grinding at the
 * form. `identifier` is the IP or the lowercased email, so the two can be
 * limited independently.
 */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    identifier: varchar("identifier", { length: 320 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("login_attempts_lookup_idx").on(
      table.identifier,
      table.kind,
      table.attemptedAt,
    ),
    index("login_attempts_attempted_idx").on(table.attemptedAt),
  ],
);

export const housesRelations = relations(houses, ({ many }) => ({
  flocks: many(flocks),
  dailyRecords: many(dailyRecords),
  readings: many(houseReadings),
}));

export const flocksRelations = relations(flocks, ({ one, many }) => ({
  house: one(houses, { fields: [flocks.houseId], references: [houses.id] }),
  dailyRecords: many(dailyRecords),
  mortalityRecords: many(mortalityRecords),
  weightRecords: many(weightRecords),
  healthEvents: many(healthEvents),
  vaccinations: many(vaccinations),
}));

export const dailyRecordsRelations = relations(dailyRecords, ({ one }) => ({
  house: one(houses, { fields: [dailyRecords.houseId], references: [houses.id] }),
  flock: one(flocks, { fields: [dailyRecords.flockId], references: [flocks.id] }),
  recordedBy: one(users, {
    fields: [dailyRecords.recordedById],
    references: [users.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
  payments: many(payments),
  deliveries: many(deliveries),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  payments: many(payments),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  items: many(inventoryItems),
  expenses: many(expenses),
}));

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    supplier: one(suppliers, {
      fields: [inventoryItems.supplierId],
      references: [suppliers.id],
    }),
    movements: many(inventoryMovements),
  }),
);

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  order: one(orders, { fields: [deliveries.orderId], references: [orders.id] }),
  driver: one(users, { fields: [deliveries.driverId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(users, { fields: [tasks.assigneeId], references: [users.id] }),
}));

/* -------------------------------------------------------------------------- */
/* Inferred types                                                             */
/* -------------------------------------------------------------------------- */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type House = typeof houses.$inferSelect;
export type Flock = typeof flocks.$inferSelect;
export type DailyRecord = typeof dailyRecords.$inferSelect;
export type MortalityRecord = typeof mortalityRecords.$inferSelect;
export type WeightRecord = typeof weightRecords.$inferSelect;
export type EggCollection = typeof eggCollections.$inferSelect;
export type HealthEvent = typeof healthEvents.$inferSelect;
export type Vaccination = typeof vaccinations.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Delivery = typeof deliveries.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type FarmSettings = typeof farmSettings.$inferSelect;

export type UserRole = (typeof userRole.enumValues)[number];
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type DeliveryStatus = (typeof deliveryStatus.enumValues)[number];
export type TaskStatus = (typeof taskStatus.enumValues)[number];
