// Seed data for the expense/income category reference guide.
// Sourced from the workbook's 36-item CategoryList (WORKBOOK_SPEC.md §4) and
// the embedded cell-comment guidance the original author wrote (§11).
// `keywords` power the "what category should I use for X" search (spec §12).

export type SeedCategory = {
  name: string;
  type: "income" | "expense" | "owner_contribution" | "owner_distribution";
  description: string;
  taxGuidance?: string;
  keywords?: string;
  isOtherExpense?: boolean;
  isContractLabor?: boolean;
  homeOfficeEligible?: boolean;
};

export const CATEGORY_SEED: SeedCategory[] = [
  {
    name: "Revenue",
    type: "income",
    description: "Sales, commissions, bonuses, and any other money your business earned.",
    keywords: "sales, commission, bonus, income, revenue, client payment, invoice paid",
  },
  {
    name: "Accounting",
    type: "expense",
    description: "Bookkeeping, tax prep, and accounting software or professional fees.",
    keywords: "bookkeeper, cpa, tax prep, quickbooks, turbotax",
  },
  {
    name: "Advertising",
    type: "expense",
    description: "Costs to promote your business: online ads, print ads, signage, business cards, website design.",
    keywords: "facebook ads, google ads, marketing, business cards, signage, website, seo, flyers, canva design",
  },
  {
    name: "Auto Expenses",
    type: "expense",
    description: "Vehicle costs for business use: either mileage or actual expenses (gas, maintenance, insurance).",
    taxGuidance:
      "You must track mileage regardless of which method you use, and you generally cannot switch between the mileage method and the actual-expense method for the same vehicle once you've elected one.",
    keywords: "mileage, gas, car, vehicle, fuel, auto insurance, car repair",
  },
  {
    name: "Bank Charges & Merchant Fees",
    type: "expense",
    description: "Bank fees, wire fees, and credit-card processing/merchant fees.",
    keywords: "stripe fee, square fee, paypal fee, wire fee, overdraft, monthly bank fee",
  },
  {
    name: "Commissions and Fees Paid",
    type: "expense",
    description: "Commissions or referral fees you paid to others (not W-2 wages or 1099 contract labor).",
    keywords: "referral fee, commission split, finder's fee",
  },
  {
    name: "Contract Labor",
    type: "expense",
    isContractLabor: true,
    description: "Payments to independent contractors/freelancers for services. Tracked for 1099-NEC filing.",
    // Does NOT hardcode a dollar threshold here on purpose: it used to say
    // "$600 or more," which was correct through 2025 but became wrong for
    // 2026+ once the One Big Beautiful Bill Act (OBBBA §90402) raised the
    // Form 1099-NEC threshold to $2,000 (see get1099Threshold in
    // src/lib/data/contractors.ts). This static, non-year-aware reference
    // table has no way to show the right figure for every tax year, so it
    // points to the Contractors & 1099s page instead, which computes the
    // correct year-specific threshold live.
    taxGuidance:
      "If you pay a service vendor enough this year to cross the Form 1099-NEC filing threshold, you're generally required to issue them a Form 1099-NEC by January 31 of the following year. Check the Contractors & 1099s page for the exact threshold for your tax year (it changed for 2026 and later under the One Big Beautiful Bill Act). Track every contractor payment here so year-end totals are accurate.",
    keywords: "freelancer, subcontractor, 1099, independent contractor, virtual assistant",
  },
  {
    name: "Dues & Subscriptions",
    type: "expense",
    description: "Membership dues, association fees, and recurring software/service subscriptions.",
    keywords: "adobe, adobe creative cloud, software subscription, saas, mls dues, association membership, netflix for business use, canva subscription",
  },
  {
    name: "Insurance (not including health)",
    type: "expense",
    homeOfficeEligible: true,
    description: "Business liability, E&O, or property insurance. Use the full amount for a business-owned building; use the Home Office calculator for a home-office-apportioned amount.",
    taxGuidance: "Health insurance has its own tax treatment. Talk to your accountant, since you may benefit from an HSA/HRA instead of recording it here.",
    keywords: "liability insurance, e&o insurance, business insurance, errors and omissions",
  },
  {
    name: "Interest (business bank loans and credit cards, etc.)",
    type: "expense",
    homeOfficeEligible: true,
    description: "Interest paid on business loans or credit cards. Mortgage interest on a home office can also be apportioned here via the Home Office calculator.",
    keywords: "loan interest, credit card interest, mortgage interest, line of credit",
  },
  {
    name: "Janitorial",
    type: "expense",
    description: "Cleaning services for your business space.",
    keywords: "cleaning service, janitor, office cleaning",
  },
  {
    name: "Leased Equipment",
    type: "expense",
    description: "Lease payments for business equipment (copiers, computers, machinery).",
    keywords: "equipment lease, copier lease, computer lease",
  },
  {
    name: "Legal and Other Professional Fees",
    type: "expense",
    description: "Attorney fees, consulting fees, and other professional services.",
    keywords: "lawyer, attorney, legal fee, consultant",
  },
  {
    name: "Meals",
    type: "expense",
    description: "Business meals with clients, prospects, or partners.",
    taxGuidance:
      "Enter the FULL, un-reduced amount here. Let your accountant apply the required deduction percentage so it isn't accidentally reduced twice. Annotate receipts with who you dined with and the business purpose, and keep them for 7 years.",
    keywords: "restaurant, client lunch, business dinner, coffee meeting",
  },
  {
    name: "Office Equipment",
    type: "expense",
    description: "Larger equipment purchases: computers, printers, furniture.",
    keywords: "computer, laptop, printer, desk, monitor, office furniture",
  },
  {
    name: "Office Supplies & Expenses",
    type: "expense",
    description: "Consumable office supplies: paper, pens, toner, small purchases.",
    keywords: "paper, pens, toner, ink, staples, office depot",
  },
  {
    name: "Officer Compensation",
    type: "expense",
    description: "W-2 salary paid to a corporate officer/owner (S-Corp reasonable compensation).",
    keywords: "officer salary, s-corp salary, owner salary, payroll salary",
  },
  {
    name: "Parking and Tolls",
    type: "expense",
    description: "Parking fees and toll charges incurred for business travel.",
    keywords: "parking, toll, garage fee",
  },
  {
    name: "Payroll Taxes",
    type: "expense",
    description: "Employer-side payroll taxes (Social Security, Medicare, unemployment) for W-2 employees.",
    keywords: "fica, futa, suta, employer payroll tax",
  },
  {
    name: "Postage and Freight",
    type: "expense",
    description: "Shipping, postage, and freight costs.",
    keywords: "shipping, ups, fedex, usps, postage",
  },
  {
    name: "Printing",
    type: "expense",
    description: "Printing costs for marketing materials, documents, or signage.",
    keywords: "print shop, copies, brochures",
  },
  {
    name: "Property Taxes",
    type: "expense",
    homeOfficeEligible: true,
    description: "Property taxes on a business-owned building. Use the Home Office calculator for a home-office-apportioned amount.",
    keywords: "real estate tax, property tax",
  },
  {
    name: "Rent Expense (Buildings)",
    type: "expense",
    description: "Rent paid for business office/retail/warehouse space.",
    keywords: "office rent, lease payment, coworking space",
  },
  {
    name: "Repairs & Maintenance",
    type: "expense",
    description: "Repairs and upkeep for business property or equipment.",
    keywords: "repair, maintenance, handyman",
  },
  {
    name: "Security",
    type: "expense",
    description: "Security services or systems for your business.",
    taxGuidance: "Be cautious about deducting pet-related expenses as \"security.\" This generally won't survive an audit.",
    keywords: "alarm system, security guard, camera system",
  },
  {
    name: "Supplies",
    type: "expense",
    description: "General business supplies not covered by Office Supplies.",
    keywords: "supplies, materials",
  },
  {
    name: "Telephone",
    type: "expense",
    description: "Business phone lines and business-use portion of a cell phone.",
    keywords: "cell phone, phone bill, business line",
  },
  {
    name: "Tools (Small)",
    type: "expense",
    description: "Small tools used in the business (below your capitalization threshold).",
    keywords: "hand tools, small equipment",
  },
  {
    name: "Travel",
    type: "expense",
    description: "Airfare, lodging, and related costs for business travel.",
    taxGuidance:
      "A common audit trigger: keep records showing the trip was primarily for business (a common rule of thumb is 4+ hours of business activity per day). Personal days mixed into a business trip should be apportioned, not deducted in full.",
    keywords: "airfare, hotel, flight, conference travel, lodging",
  },
  {
    name: "Uniforms",
    type: "expense",
    description: "Required work clothing that isn't suitable for everyday streetwear.",
    taxGuidance:
      "The IRS test is whether the clothing is suitable for everyday wear: a branded polo you'd never wear outside work generally qualifies. Note: the cost of imprinting a logo on an otherwise-ordinary garment can be deducted as Advertising even if the garment itself doesn't qualify as a Uniform.",
    keywords: "work clothes, branded apparel, safety gear",
  },
  {
    name: "Utilities",
    type: "expense",
    homeOfficeEligible: true,
    description: "Electric, gas, water, internet for a business-owned building. Use the Home Office calculator for a home-office-apportioned amount.",
    taxGuidance:
      "If you're apportioning a personal utility bill through the Home Office calculator, record the business portion as a transfer from your personal account, not as a direct business-account transaction.",
    keywords: "electric bill, gas bill, internet bill, home office utilities",
  },
  {
    name: "Wages Paid",
    type: "expense",
    description: "W-2 wages paid to employees (not officer compensation, not contract labor).",
    keywords: "employee wages, payroll, salary",
  },
  {
    name: "Water, Sewer, Trash",
    type: "expense",
    homeOfficeEligible: true,
    description: "Water, sewer, and trash service for a business-owned building. Use the Home Office calculator for a home-office-apportioned amount.",
    keywords: "water bill, sewer, trash pickup, garbage",
  },
  {
    name: "Other Expenses",
    type: "expense",
    isOtherExpense: true,
    description: "A catch-all for anything that doesn't fit another category. Requires a short description so your accountant knows what it was.",
    keywords: "miscellaneous, other, misc",
  },
  {
    name: "Contributions from Owner",
    type: "owner_contribution",
    description: "Money the owner put into the business. This affects your bank balance but is not business income.",
    taxGuidance: "Look for bank-statement lines like \"Deposit\" or \"Transfer from [personal account]\".",
    keywords: "owner deposit, capital contribution, transfer in",
  },
  {
    name: "Distributions (Draws) to Owner",
    type: "owner_distribution",
    description: "Money the owner took out of the business. This affects your bank balance but is not a business expense.",
    taxGuidance: "Look for bank-statement lines like \"Withdrawal\" or \"Transfer to [personal account]\".",
    keywords: "owner draw, distribution, transfer out, owner pay",
  },
];
