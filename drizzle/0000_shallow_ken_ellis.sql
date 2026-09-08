CREATE TYPE "public"."business_type" AS ENUM('sole_prop', 's_corp');--> statement-breakpoint
CREATE TYPE "public"."category_type" AS ENUM('income', 'expense', 'owner_contribution', 'owner_distribution');--> statement-breakpoint
CREATE TYPE "public"."filing_status" AS ENUM('single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household');--> statement-breakpoint
CREATE TYPE "public"."reconciliation_status" AS ENUM('unreconciled', 'reconciled');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'owner_contribution', 'owner_distribution');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"business_name" text DEFAULT 'My Business' NOT NULL,
	"tax_year" integer NOT NULL,
	"business_type" "business_type" DEFAULT 'sole_prop' NOT NULL,
	"filing_status" "filing_status" DEFAULT 'single' NOT NULL,
	"is_s_corp" boolean DEFAULT false NOT NULL,
	"s_corp_salary" numeric(14, 2),
	"beginning_bank_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"home_office_used" boolean DEFAULT false NOT NULL,
	"home_office_sq_ft" numeric(10, 2),
	"total_home_sq_ft" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "category_type" NOT NULL,
	"description" text,
	"tax_guidance" text,
	"keywords" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_other_expense" boolean DEFAULT false NOT NULL,
	"is_contract_labor" boolean DEFAULT false NOT NULL,
	"home_office_eligible" boolean DEFAULT false NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "reconciliations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"month" date NOT NULL,
	"beginning_balance" numeric(14, 2) NOT NULL,
	"calculated_ending_balance" numeric(14, 2) NOT NULL,
	"statement_ending_balance" numeric(14, 2),
	"difference" numeric(14, 2),
	"status" "reconciliation_status" DEFAULT 'unreconciled' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"vendor_name" text,
	"notes" text,
	"other_expense_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reconciliations" ADD CONSTRAINT "reconciliations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reconciliations_business_month_idx" ON "reconciliations" USING btree ("business_id","month");--> statement-breakpoint
CREATE INDEX "transactions_business_date_idx" ON "transactions" USING btree ("business_id","date");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category_id");