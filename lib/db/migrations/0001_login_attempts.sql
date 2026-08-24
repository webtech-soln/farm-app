CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" varchar(320) NOT NULL,
	"kind" varchar(16) NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "login_attempts_lookup_idx" ON "login_attempts" USING btree ("identifier","kind","attempted_at");--> statement-breakpoint
CREATE INDEX "login_attempts_attempted_idx" ON "login_attempts" USING btree ("attempted_at");