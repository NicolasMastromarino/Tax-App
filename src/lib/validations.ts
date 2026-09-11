import { z } from "zod";

export const transactionTypeSchema = z.enum([
  "income",
  "expense",
  "owner_contribution",
  "owner_distribution",
]);

export const transactionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date"),
    description: z.string().trim().min(1, "Description is required").max(255),
    categoryId: z.string().uuid("Choose a category"),
    type: transactionTypeSchema,
    amount: z.coerce
      .number({ error: "Enter a valid amount" })
      .positive("Amount must be greater than zero")
      .max(100_000_000, "That amount looks too large"),
    vendorName: z.string().trim().max(255).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    otherExpenseDescription: z.string().trim().max(255).optional().or(z.literal("")),
  })
  .refine((val) => Number.isFinite(val.amount) && val.amount > 0, {
    message: "Amount must be a positive number",
    path: ["amount"],
  });

export type TransactionInput = z.infer<typeof transactionSchema>;

export const businessSettingsSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required").max(255),
  taxYear: z.coerce.number().int().min(2000).max(2100),
  businessType: z.enum(["sole_prop", "s_corp"]),
  filingStatus: z.enum([
    "single",
    "married_filing_jointly",
    "married_filing_separately",
    "head_of_household",
  ]),
  isSCorp: z.coerce.boolean().optional().default(false),
  sCorpSalary: z.coerce.number().min(0).optional().nullable(),
  beginningBankBalance: z.coerce.number(),
  homeOfficeUsed: z.coerce.boolean().optional().default(false),
  homeOfficeSqFt: z.coerce.number().min(0).optional().nullable(),
  totalHomeSqFt: z.coerce.number().min(0).optional().nullable(),
  // Tax Planner refinements (spec §12.11, §12.5):
  spouseIncome: z.coerce.number().min(0).optional().nullable(),
  isSstb: z.coerce.boolean().optional().default(true),
  w2WagesPaid: z.coerce.number().min(0).optional().default(0),
  ubiaQualifiedProperty: z.coerce.number().min(0).optional().default(0),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(255),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    businessName: z.string().trim().min(1, "Business name is required").max(255),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const reconciliationSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}-01$/),
  statementEndingBalance: z.coerce.number(),
});

export const taxPaymentSchema = z.object({
  taxYear: z.coerce.number().int().min(2000).max(2100),
  quarter: z.coerce.number().int().min(1).max(4),
  amountPaid: z.coerce.number().min(0, "Amount can't be negative"),
  datePaid: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date")
    .optional()
    .or(z.literal("")),
});

// Vendor/contractor contact + compliance info for the 1099 page (spec §7.4 /
// §11). Matched to a business's Contract-Labor transactions by name.
export const vendorSchema = z.object({
  name: z.string().trim().min(1, "Vendor name is required").max(255),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(255)
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  taxId: z.string().trim().max(50).optional().or(z.literal("")),
  w9Received: z.coerce.boolean().optional().default(false),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type VendorInput = z.infer<typeof vendorSchema>;

// Blog posts, written from /admin (see src/lib/actions/blog-actions.ts).
// Slug is restricted to what's safe in a URL path segment and matches the
// convention used in the filenames of the blog's original markdown-file
// version (lowercase, hyphen-separated).
export const blogPostSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(255)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().trim().min(1, "Post content can't be empty"),
  published: z.coerce.boolean().optional().default(false),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
