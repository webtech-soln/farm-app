CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('pending_sync', 'synced', 'needs_review');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('active', 'dormant', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('wholesaler', 'retailer', 'restaurant', 'walk_in');--> statement-breakpoint
CREATE TYPE "public"."delivery_method" AS ENUM('own_fleet', 'pickup', 'third_party');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('scheduled', 'preparing', 'in_transit', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."duty_status" AS ENUM('on_duty', 'visiting', 'on_road', 'on_leave', 'off_duty');--> statement-breakpoint
CREATE TYPE "public"."egg_session" AS ENUM('morning', 'midday', 'evening');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('feed', 'labour', 'medicine', 'utilities', 'transport', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."flock_status" AS ENUM('healthy', 'warning', 'brooding', 'treatment', 'closed');--> statement-breakpoint
CREATE TYPE "public"."flock_type" AS ENUM('broiler', 'layer');--> statement-breakpoint
CREATE TYPE "public"."health_status" AS ENUM('escalated', 'in_treatment', 'monitoring', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."house_status" AS ENUM('healthy', 'warning', 'brooding', 'maintenance', 'empty');--> statement-breakpoint
CREATE TYPE "public"."inventory_category" AS ENUM('feed', 'medicine', 'equipment', 'packaging', 'consumable', 'other');--> statement-breakpoint
CREATE TYPE "public"."mortality_status" AS ENUM('pending', 'reviewed', 'under_treatment', 'escalated');--> statement-breakpoint
CREATE TYPE "public"."movement_type" AS ENUM('stock_in', 'stock_out', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('health', 'inventory', 'tasks', 'finance', 'sales', 'system');--> statement-breakpoint
CREATE TYPE "public"."order_event_kind" AS ENUM('placed', 'payment', 'packed', 'transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'cash', 'card', 'mobile_money', 'cheque', 'part_cash');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partial', 'paid', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('in_stock', 'low_stock', 'out_of_stock');--> statement-breakpoint
CREATE TYPE "public"."record_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."report_format" AS ENUM('pdf', 'excel', 'csv');--> statement-breakpoint
CREATE TYPE "public"."report_origin" AS ENUM('manual', 'scheduled');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('queued', 'generating', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."supplier_status" AS ENUM('active', 'inactive', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tone" AS ENUM('violet', 'success', 'warning', 'error', 'info', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'supervisor', 'attendant', 'vet', 'sales', 'driver');--> statement-breakpoint
CREATE TYPE "public"."vaccination_status" AS ENUM('scheduled', 'completed', 'overdue', 'cancelled');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"type" "customer_type" NOT NULL,
	"location" varchar(120),
	"phone" varchar(32),
	"email" varchar(255),
	"status" "customer_status" DEFAULT 'active' NOT NULL,
	"credit_limit_cents" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_id" integer NOT NULL,
	"flock_id" integer,
	"record_date" date NOT NULL,
	"starting_birds" integer NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"culls" integer DEFAULT 0 NOT NULL,
	"transfers_out" integer DEFAULT 0 NOT NULL,
	"closing_birds" integer NOT NULL,
	"feed_kg" double precision,
	"feed_type" varchar(80),
	"feed_batch" varchar(60),
	"feed_item_id" integer,
	"water_litres" double precision,
	"temp_min_c" double precision,
	"temp_max_c" double precision,
	"humidity_pct" double precision,
	"ventilation" varchar(60),
	"eggs_collected" integer,
	"eggs_broken" integer,
	"avg_weight_kg" double precision,
	"sample_size" integer,
	"uniformity_pct" double precision,
	"notes" text,
	"status" "record_status" DEFAULT 'draft' NOT NULL,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deliveries" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"driver_id" integer,
	"destination" varchar(160) NOT NULL,
	"route_name" varchar(80),
	"scheduled_on" date NOT NULL,
	"window_start" time,
	"window_end" time,
	"status" "delivery_status" DEFAULT 'scheduled' NOT NULL,
	"weight_kg" double precision,
	"attempts" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "egg_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_id" integer NOT NULL,
	"flock_id" integer,
	"collected_on" date NOT NULL,
	"collected_at" time NOT NULL,
	"session" "egg_session" NOT NULL,
	"collected" integer NOT NULL,
	"broken" integer DEFAULT 0 NOT NULL,
	"grade_a" integer DEFAULT 0 NOT NULL,
	"grade_b" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"size_small" integer DEFAULT 0 NOT NULL,
	"size_medium" integer DEFAULT 0 NOT NULL,
	"size_large" integer DEFAULT 0 NOT NULL,
	"size_extra_large" integer DEFAULT 0 NOT NULL,
	"status" "collection_status" DEFAULT 'synced' NOT NULL,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"expense_date" date NOT NULL,
	"description" varchar(200) NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount_cents" integer NOT NULL,
	"supplier_id" integer,
	"method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farm_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"farm_name" varchar(160) NOT NULL,
	"registered_name" varchar(160),
	"estate_name" varchar(160),
	"address" varchar(240),
	"city_state" varchar(160),
	"country" varchar(80),
	"timezone" varchar(80),
	"currency" varchar(16),
	"weight_unit" varchar(32),
	"temperature_unit" varchar(32),
	"volume_unit" varchar(32),
	"date_format" varchar(32),
	"daily_mortality_alert_pct" double precision DEFAULT 0.4 NOT NULL,
	"weekly_mortality_alert_pct" double precision DEFAULT 2 NOT NULL,
	"min_production_rate_pct" double precision DEFAULT 82 NOT NULL,
	"feed_minimum_stock_kg" double precision DEFAULT 1000 NOT NULL,
	"medicine_expiry_warning_days" integer DEFAULT 30 NOT NULL,
	"temperature_min_c" double precision DEFAULT 24 NOT NULL,
	"temperature_max_c" double precision DEFAULT 30 NOT NULL,
	"escalate_critical_alerts" boolean DEFAULT true NOT NULL,
	"block_anomalous_records" boolean DEFAULT true NOT NULL,
	"auto_purchase_suggestions" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"house_id" integer,
	"type" "flock_type" NOT NULL,
	"breed" varchar(80) NOT NULL,
	"initial_count" integer NOT NULL,
	"current_count" integer NOT NULL,
	"started_on" date NOT NULL,
	"closed_on" date,
	"status" "flock_status" DEFAULT 'healthy' NOT NULL,
	"source_hatchery" varchar(120),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "health_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"flock_id" integer NOT NULL,
	"house_id" integer,
	"occurred_on" date NOT NULL,
	"condition" varchar(120) NOT NULL,
	"cases" integer NOT NULL,
	"treatment" varchar(160),
	"status" "health_status" DEFAULT 'monitoring' NOT NULL,
	"notes" text,
	"reported_by_id" integer,
	"resolved_on" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "house_readings" (
	"id" serial PRIMARY KEY NOT NULL,
	"house_id" integer NOT NULL,
	"recorded_at" timestamp with time zone NOT NULL,
	"temperature_c" double precision NOT NULL,
	"humidity_pct" double precision
);
--> statement-breakpoint
CREATE TABLE "houses" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"name" varchar(80) NOT NULL,
	"capacity" integer NOT NULL,
	"status" "house_status" DEFAULT 'healthy' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(40) NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" "inventory_category" NOT NULL,
	"subcategory" varchar(60),
	"quantity" double precision DEFAULT 0 NOT NULL,
	"unit" varchar(24) NOT NULL,
	"unit_cost_cents" integer DEFAULT 0 NOT NULL,
	"min_stock" double precision DEFAULT 0 NOT NULL,
	"batch" varchar(60),
	"expiry_date" date,
	"supplier_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_id" integer NOT NULL,
	"type" "movement_type" NOT NULL,
	"quantity" double precision NOT NULL,
	"unit_cost_cents" integer,
	"occurred_on" date NOT NULL,
	"reference" varchar(80),
	"note" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mortality_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"flock_id" integer NOT NULL,
	"house_id" integer,
	"occurred_on" date NOT NULL,
	"occurred_at" time,
	"deaths" integer NOT NULL,
	"cause" varchar(120) NOT NULL,
	"status" "mortality_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"channel" varchar(40) NOT NULL,
	"scope" varchar(80) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"category" "notification_category" NOT NULL,
	"tone" "tone" DEFAULT 'info' NOT NULL,
	"icon" varchar(40) DEFAULT 'alert' NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"link_label" varchar(80),
	"link_href" varchar(200),
	"action_label" varchar(60),
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"kind" "order_event_kind" NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_id" integer
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"product_name" varchar(120) NOT NULL,
	"quantity" double precision NOT NULL,
	"unit" varchar(40),
	"unit_price_cents" integer NOT NULL,
	"line_total_cents" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"reference" varchar(32) NOT NULL,
	"customer_id" integer NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"delivery_method" "delivery_method" DEFAULT 'own_fleet' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"delivery_fee_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer,
	"customer_id" integer,
	"amount_cents" integer NOT NULL,
	"method" "payment_method" DEFAULT 'bank_transfer' NOT NULL,
	"received_on" date NOT NULL,
	"reference" varchar(60),
	"description" varchar(200),
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"category" varchar(60) NOT NULL,
	"icon" varchar(40) DEFAULT 'package' NOT NULL,
	"price_cents" integer NOT NULL,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"unit" varchar(40) NOT NULL,
	"available_qty" double precision DEFAULT 0 NOT NULL,
	"available_unit" varchar(40),
	"status" "product_status" DEFAULT 'in_stock' NOT NULL,
	"note" varchar(80),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"report_key" varchar(60) NOT NULL,
	"origin" "report_origin" DEFAULT 'manual' NOT NULL,
	"schedule_label" varchar(60),
	"period_start" date,
	"period_end" date,
	"period_label" varchar(80),
	"format" "report_format" DEFAULT 'pdf' NOT NULL,
	"size_bytes" integer,
	"status" "report_status" DEFAULT 'ready' NOT NULL,
	"generated_by_id" integer,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" varchar(400),
	"ip_address" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"location" varchar(160),
	"category" varchar(80),
	"contact" varchar(60),
	"email" varchar(255),
	"status" "supplier_status" DEFAULT 'active' NOT NULL,
	"outstanding_cents" integer DEFAULT 0 NOT NULL,
	"overdue_days" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"detail" varchar(240),
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"context_label" varchar(80),
	"assignee_id" integer,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'attendant' NOT NULL,
	"job_title" varchar(120),
	"phone" varchar(32),
	"assigned_area" varchar(160),
	"attendance_pct" double precision,
	"duty_status" "duty_status" DEFAULT 'on_duty' NOT NULL,
	"joined_on" date,
	"is_contractor" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vaccinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"flock_id" integer,
	"house_id" integer,
	"vaccine" varchar(120) NOT NULL,
	"route" varchar(80) NOT NULL,
	"scheduled_on" date NOT NULL,
	"scheduled_at" time,
	"administered_at" timestamp with time zone,
	"administered_by_id" integer,
	"doses" integer NOT NULL,
	"status" "vaccination_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weight_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"flock_id" integer NOT NULL,
	"house_id" integer,
	"recorded_on" date NOT NULL,
	"age_days" integer,
	"avg_weight_kg" double precision NOT NULL,
	"standard_weight_kg" double precision,
	"sample_size" integer NOT NULL,
	"uniformity_pct" double precision,
	"recorded_by_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_records" ADD CONSTRAINT "daily_records_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_events" ADD CONSTRAINT "health_events_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_events" ADD CONSTRAINT "health_events_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "health_events" ADD CONSTRAINT "health_events_reported_by_id_users_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "house_readings" ADD CONSTRAINT "house_readings_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mortality_records" ADD CONSTRAINT "mortality_records_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_id_users_id_fk" FOREIGN KEY ("generated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaccinations" ADD CONSTRAINT "vaccinations_administered_by_id_users_id_fk" FOREIGN KEY ("administered_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_house_id_houses_id_fk" FOREIGN KEY ("house_id") REFERENCES "public"."houses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_records" ADD CONSTRAINT "weight_records_recorded_by_id_users_id_fk" FOREIGN KEY ("recorded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customers_name_unique" ON "customers" USING btree (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "daily_records_house_date_unique" ON "daily_records" USING btree ("house_id","record_date");--> statement-breakpoint
CREATE INDEX "daily_records_date_idx" ON "daily_records" USING btree ("record_date");--> statement-breakpoint
CREATE INDEX "daily_records_flock_idx" ON "daily_records" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "deliveries_order_idx" ON "deliveries" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "deliveries_date_idx" ON "deliveries" USING btree ("scheduled_on");--> statement-breakpoint
CREATE INDEX "deliveries_driver_idx" ON "deliveries" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "egg_collections_date_idx" ON "egg_collections" USING btree ("collected_on");--> statement-breakpoint
CREATE INDEX "egg_collections_house_idx" ON "egg_collections" USING btree ("house_id");--> statement-breakpoint
CREATE INDEX "expenses_date_idx" ON "expenses" USING btree ("expense_date");--> statement-breakpoint
CREATE INDEX "expenses_category_idx" ON "expenses" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "flocks_code_unique" ON "flocks" USING btree ("code");--> statement-breakpoint
CREATE INDEX "flocks_house_idx" ON "flocks" USING btree ("house_id");--> statement-breakpoint
CREATE INDEX "flocks_status_idx" ON "flocks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "health_events_flock_idx" ON "health_events" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "health_events_date_idx" ON "health_events" USING btree ("occurred_on");--> statement-breakpoint
CREATE INDEX "house_readings_house_time_idx" ON "house_readings" USING btree ("house_id","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "houses_code_unique" ON "houses" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_sku_unique" ON "inventory_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "inventory_items_category_idx" ON "inventory_items" USING btree ("category");--> statement-breakpoint
CREATE INDEX "inventory_movements_item_idx" ON "inventory_movements" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_date_idx" ON "inventory_movements" USING btree ("occurred_on");--> statement-breakpoint
CREATE INDEX "mortality_flock_idx" ON "mortality_records" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "mortality_date_idx" ON "mortality_records" USING btree ("occurred_on");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_prefs_user_channel_unique" ON "notification_preferences" USING btree ("user_id","channel");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_reference_unique" ON "orders" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_placed_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_date_idx" ON "payments" USING btree ("received_on");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_unique" ON "products" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "reports_generated_idx" ON "reports" USING btree ("generated_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_name_unique" ON "suppliers" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "vaccinations_scheduled_idx" ON "vaccinations" USING btree ("scheduled_on");--> statement-breakpoint
CREATE INDEX "vaccinations_flock_idx" ON "vaccinations" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "weight_flock_idx" ON "weight_records" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "weight_date_idx" ON "weight_records" USING btree ("recorded_on");