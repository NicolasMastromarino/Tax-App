CREATE TABLE "qbi_phaseout_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_year" integer NOT NULL,
	"filing_status" "filing_status" NOT NULL,
	"phaseout_start" numeric(14, 2) NOT NULL,
	"phaseout_end" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_brackets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_year" integer NOT NULL,
	"filing_status" "filing_status" NOT NULL,
	"rate" numeric(6, 4) NOT NULL,
	"lower_bound" numeric(14, 2) NOT NULL,
	"upper_bound" numeric(14, 2),
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_parameters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tax_year" integer NOT NULL,
	"se_wage_base" numeric(14, 2) NOT NULL,
	"se_taxable_fraction" numeric(6, 4) DEFAULT '0.9235' NOT NULL,
	"se_full_rate" numeric(6, 4) DEFAULT '0.153' NOT NULL,
	"se_medicare_only_rate" numeric(6, 4) DEFAULT '0.029' NOT NULL,
	"se_deductible_fraction" numeric(6, 4) DEFAULT '0.5' NOT NULL,
	"qbi_rate" numeric(6, 4) DEFAULT '0.20' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tax_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"tax_year" integer NOT NULL,
	"quarter" integer NOT NULL,
	"amount_paid" numeric(14, 2) DEFAULT '0' NOT NULL,
	"date_paid" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tax_payments" ADD CONSTRAINT "tax_payments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "qbi_phaseout_year_status_idx" ON "qbi_phaseout_parameters" USING btree ("tax_year","filing_status");--> statement-breakpoint
CREATE INDEX "tax_brackets_year_status_idx" ON "tax_brackets" USING btree ("tax_year","filing_status","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_parameters_year_idx" ON "tax_parameters" USING btree ("tax_year");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_payments_business_year_quarter_idx" ON "tax_payments" USING btree ("business_id","tax_year","quarter");