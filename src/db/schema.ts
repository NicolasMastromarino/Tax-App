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
