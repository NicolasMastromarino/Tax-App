ALTER TABLE "businesses" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "subscription_plan" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "subscription_current_period_end" timestamp with time zone;