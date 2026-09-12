import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "owner_contribution",
  "owner_distribution",
]);

export const categoryTypeEnum = pgEnum("category_type", [
  "income",
  "expense",
  "owner_contribution",
  "owner_distribution",
]);

export const businessTypeEnum = pgEnum("business_type", [
  "sole_prop",
  "s_corp",
]);

export const filingStatusEnum = pgEnum("filing_status", [
  "single",
  "married_filing_jointly",
  "married_filing_separately",
  "head_of_household",
]);

export const reconciliationStatusEnum = pgEnum("reconciliation_status", [
  "unreconciled",
  "reconciled",
]);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  businesses: many(businesses),
}));

// ---------------------------------------------------------------------------
// Businesses (one user -> many businesses; MVP UI only surfaces one active
// business at a time, but the schema is multi-business-ready per spec §21)
// ---------------------------------------------------------------------------

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull().default("My Business"),
  taxYear: integer("tax_year").notNull(),
  businessType: businessTypeEnum("business_type").notNull().default("sole_prop"),
  filingStatus: filingStatusEnum("filing_status").notNull().default("single"),
  isSCorp: boolean("is_s_corp").notNull().default(false),
  sCorpSalary: numeric("s_corp_salary", { precision: 14, scale: 2 }),
  beginningBankBalance: numeric("beginning_bank_balance", {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default("0"),
  homeOfficeUsed: boolean("home_office_used").notNull().default(false),
  homeOfficeSqFt: numeric("home_office_sq_ft", { precision: 10, scale: 2 }),
  totalHomeSqFt: numeric("total_home_sq_ft", { precision: 10, scale: 2 }),
  // Tax Planner refinements (spec §12.6, §12.11, §12.5, §12.8):
  // spouseIncome blends a spouse's income into the household figure used for
  // bracket/QBI-phaseout/Additional-Medicare-Tax purposes on a Married Filing
  // Jointly return — only meaningful when filingStatus is MFJ. The original
  // workbook had a dead, never-wired-up named range for exactly this
  // ("SpouseIncome", spec §2/§12.11).
  spouseIncome: numeric("spouse_income", { precision: 14, scale: 2 }),
  // isSstb: whether the business is a Specified Service Trade or Business
  // for QBI purposes (law, health, consulting, financial services, and
  // similar personal-service businesses). Defaults true because the original
  // workbook's linear QBI phaseout-to-zero is only strictly correct for an
  // SSTB (spec §6.5/§12.5) — most users of this tool (e.g. real estate
  // agents) are SSTB-adjacent service providers, so this preserves existing
  // behavior for the common case. Set to false to use the real non-SSTB
  // wage/UBIA-limited formula instead.
  isSstb: boolean("is_sstb").notNull().default(true),
  // Only used when isSstb = false (spec §12.5's non-SSTB wage/UBIA
  // limitation formula). Most solo service businesses with no employees and
  // no significant depreciable property correctly leave these at 0.
  w2WagesPaid: numeric("w2_wages_paid", { precision: 14, scale: 2 }).notNull().default("0"),
  ubiaQualifiedProperty: numeric("ubia_qualified_property", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  // --- Paddle Billing (subscriptions) ---
  // Core bookkeeping (dashboard, transactions, reconciliation, reports) is
  // free forever. Tax Planner and Contractors & 1099s require an active
  // subscription — see src/lib/data/subscription.ts for the access check.
  // All nullable: null/no row activity means "never subscribed", which is
  // the correct default for every existing business.
  paddleCustomerId: text("paddle_customer_id"),
  paddleSubscriptionId: text("paddle_subscription_id"),
  // Raw status string as sent by Paddle (e.g. "active", "trialing",
  // "past_due", "paused", "canceled") — stored as text rather than a Postgres
  // enum so a new status Paddle introduces later doesn't require a migration
  // before webhooks can be written. See subscription.ts for which statuses
  // grant access.
  subscriptionStatus: text("subscription_status"),
  // "monthly" | "annual" — which price the customer is on, for display only.
  subscriptionPlan: text("subscription_plan"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  user: one(users, { fields: [businesses.userId], references: [users.id] }),
  transactions: many(transactions),
  reconciliations: many(reconciliations),
  taxPayments: many(taxPayments),
  vendors: many(vendors),
}));

// ---------------------------------------------------------------------------
// Categories (seeded from the workbook's 36-item CategoryList, §4 of spec)
// ---------------------------------------------------------------------------

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  type: categoryTypeEnum("type").notNull(),
  description: text("description"), // plain-language "what belongs here"
  taxGuidance: text("tax_guidance"), // longer reference/audit-risk notes
  keywords: text("keywords"), // comma-separated search aids ("adobe, software" -> Dues & Subscriptions)
  sortOrder: integer("sort_order").notNull().default(0),
  isOtherExpense: boolean("is_other_expense").notNull().default(false),
  isContractLabor: boolean("is_contract_labor").notNull().default(false),
  homeOfficeEligible: boolean("home_office_eligible").notNull().default(false),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

// ---------------------------------------------------------------------------
// Transactions — the single source of truth (spec §5 / §25)
// ---------------------------------------------------------------------------

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    description: text("description").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    type: transactionTypeEnum("type").notNull(),
    // Always stored as a positive magnitude; `type` determines sign when
    // computing running/reconciled balances. This removes the workbook's
    // "Error- Double Entry" failure mode by construction (spec §6).
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    vendorName: text("vendor_name"), // free-text for MVP; formalized Contractor entity is a follow-up
    notes: text("notes"),
    otherExpenseDescription: text("other_expense_description"), // required when category.isOtherExpense
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("transactions_business_date_idx").on(t.businessId, t.date),
    index("transactions_category_idx").on(t.categoryId),
  ]
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  business: one(businesses, {
    fields: [transactions.businessId],
    references: [businesses.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// ---------------------------------------------------------------------------
// Reconciliations — one per business per calendar month (spec §8)
// ---------------------------------------------------------------------------

export const reconciliations = pgTable(
  "reconciliations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    month: date("month", { mode: "string" }).notNull(), // first-of-month marker, e.g. 2026-08-01
    beginningBalance: numeric("beginning_balance", {
      precision: 14,
      scale: 2,
    }).notNull(),
    calculatedEndingBalance: numeric("calculated_ending_balance", {
      precision: 14,
      scale: 2,
    }).notNull(),
    statementEndingBalance: numeric("statement_ending_balance", {
      precision: 14,
      scale: 2,
    }),
    difference: numeric("difference", { precision: 14, scale: 2 }),
    status: reconciliationStatusEnum("status").notNull().default("unreconciled"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("reconciliations_business_month_idx").on(t.businessId, t.month)]
);

export const reconciliationsRelations = relations(reconciliations, ({ one }) => ({
  business: one(businesses, {
    fields: [reconciliations.businessId],
    references: [businesses.id],
  }),
}));

// ---------------------------------------------------------------------------
// Tax Planner (spec §6, §14-20) — the progressive-bracket table, the QBI
// phaseout table, and the SE-tax/QBI-rate parameters are all versioned by
// tax year (spec §12.15) rather than hardcoded, so a future year's figures
// can be added without a code change. Seeded with 2025 figures; see
// src/db/seed-data/tax-2025.ts.
//
// NOTE on the fix applied here vs. the original workbook (spec §12.3): the
// workbook computes the QBI deduction and the deductible half of SE tax but
// never actually subtracts them from income before running the progressive
// bracket calculation, which overstates projected income tax. This rebuild
// subtracts both before the bracket calculation — see
// src/lib/calculations/tax.ts.
// ---------------------------------------------------------------------------

export const taxParameters = pgTable(
  "tax_parameters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taxYear: integer("tax_year").notNull(),
    // Self-employment tax (spec §6.4). seWageBase = the Social Security wage
    // base for the year (the workbook's misleadingly-named "MedMaxIncome").
    seWageBase: numeric("se_wage_base", { precision: 14, scale: 2 }).notNull(),
    seTaxableFraction: numeric("se_taxable_fraction", { precision: 6, scale: 4 })
      .notNull()
      .default("0.9235"),
    seFullRate: numeric("se_full_rate", { precision: 6, scale: 4 }).notNull().default("0.153"),
    seMedicareOnlyRate: numeric("se_medicare_only_rate", { precision: 6, scale: 4 })
      .notNull()
      .default("0.029"),
    seDeductibleFraction: numeric("se_deductible_fraction", { precision: 6, scale: 4 })
      .notNull()
      .default("0.5"),
    // QBI deduction (spec §6.5)
    qbiRate: numeric("qbi_rate", { precision: 6, scale: 4 }).notNull().default("0.20"),
    // QBI minimum deduction floor, added by the One Big Beautiful Bill Act
    // (OBBBA §70105) for tax years beginning after 2025: if a taxpayer has
    // at least qbiMinDeductionThreshold of aggregate QBI from active trades
    // where they materially participate, their QBI deduction is the
    // greater of the regular (possibly phased-out) calculation or
    // qbiMinDeductionFloor. Both null for tax years before 2026, where this
    // rule doesn't exist (verified against Rev. Proc. 2025-32 — not a
    // guess).
    qbiMinDeductionThreshold: numeric("qbi_min_deduction_threshold", {
      precision: 14,
      scale: 2,
    }),
    qbiMinDeductionFloor: numeric("qbi_min_deduction_floor", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("tax_parameters_year_idx").on(t.taxYear)]
);

export const taxBrackets = pgTable(
  "tax_brackets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taxYear: integer("tax_year").notNull(),
    filingStatus: filingStatusEnum("filing_status").notNull(),
    rate: numeric("rate", { precision: 6, scale: 4 }).notNull(),
    lowerBound: numeric("lower_bound", { precision: 14, scale: 2 }).notNull(),
    // null = top/unbounded bracket
    upperBound: numeric("upper_bound", { precision: 14, scale: 2 }),
    sortOrder: integer("sort_order").notNull(),
  },
  (t) => [
    index("tax_brackets_year_status_idx").on(t.taxYear, t.filingStatus, t.sortOrder),
  ]
);

export const qbiPhaseoutParameters = pgTable(
  "qbi_phaseout_parameters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taxYear: integer("tax_year").notNull(),
    filingStatus: filingStatusEnum("filing_status").notNull(),
    phaseoutStart: numeric("phaseout_start", { precision: 14, scale: 2 }).notNull(),
    phaseoutEnd: numeric("phaseout_end", { precision: 14, scale: 2 }).notNull(),
  },
  (t) => [uniqueIndex("qbi_phaseout_year_status_idx").on(t.taxYear, t.filingStatus)]
);

// ---------------------------------------------------------------------------
// Quarterly Estimated Tax Payment Tracker (spec §6.8)
// ---------------------------------------------------------------------------

export const taxPayments = pgTable(
  "tax_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    taxYear: integer("tax_year").notNull(),
    quarter: integer("quarter").notNull(), // 1-4
    amountPaid: numeric("amount_paid", { precision: 14, scale: 2 }).notNull().default("0"),
    datePaid: date("date_paid", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("tax_payments_business_year_quarter_idx").on(
      t.businessId,
      t.taxYear,
      t.quarter
    ),
  ]
);

export const taxPaymentsRelations = relations(taxPayments, ({ one }) => ({
  business: one(businesses, {
    fields: [taxPayments.businessId],
    references: [businesses.id],
  }),
}));

// ---------------------------------------------------------------------------
// Vendors — contractor contact/compliance info for the 1099 page (spec §7.4
// / §11). The original workbook's "1099" sheet only tracked a name + amount
// pair (aggregated from Contract-Labor-category transactions); it never
// captured the contact/W-9/tax-ID info you'd actually need to file a 1099,
// so this table adds that as a separate, optional-per-vendor record matched
// by name. The $600/year "needs a 1099?" total itself is still computed
// live from transactions (see lib/data/contractors.ts), not stored here.
// ---------------------------------------------------------------------------

export const vendors = pgTable(
  "vendors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    taxId: text("tax_id"), // EIN or SSN, as provided on the vendor's W-9
    w9Received: boolean("w9_received").notNull().default(false),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("vendors_business_name_idx").on(t.businessId, t.name)]
);

export const vendorsRelations = relations(vendors, ({ one }) => ({
  business: one(businesses, { fields: [vendors.businessId], references: [businesses.id] }),
}));

// ---------------------------------------------------------------------------
// Blog posts — a single site-wide blog (not per-business/per-user). Written
// and published from /admin, which is gated to the founder account (see
// FOUNDER_EMAILS in src/lib/data/subscription.ts). `content` is the raw
// markdown source; it's rendered to HTML at read time (see src/lib/blog.ts)
// rather than stored pre-rendered, so a future change to the renderer or its
// styling applies retroactively to every existing post.
// ---------------------------------------------------------------------------

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    content: text("content").notNull(),
    // Path to a file in public/blog, or an external image URL. Shown on
    // the /blog index card and at the top of the post; optional, so
    // existing posts without one just render without an image.
    featuredImage: text("featured_image"),
    // Drafts (published: false) are excluded from the public /blog index but
    // are still viewable at their direct /blog/[slug] URL, so a draft link
    // can be shared/previewed before it's announced. Low-risk for a
    // single-author blog; revisit if this ever needs real access control.
    published: boolean("published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("blog_posts_slug_idx").on(t.slug)]
);
