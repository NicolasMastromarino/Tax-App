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
