# Bookkeeply — Exhaustive Formula Test Report

**Date:** 2026-09-11
**Scope:** Every calculation path in the app (SE tax, QBI deduction, income tax brackets, Sole-Prop-vs-S-Corp comparison, home office deduction, quarterly safe-harbor payments, Additional Medicare Tax, bank reconciliation, 1099/contractor threshold logic, P&L reports), driven through 4 real user accounts and cross-checked against an independent hand/Python calculation of what the IRS rules actually require.

## Method

1. Re-ran the existing automated suite first as a baseline: **55/55 unit tests passing** (SE tax, QBI phaseout/SSTB/non-SSTB/minimum-floor, brackets, safe-harbor — this suite was already solid going in).
2. Designed 4 realistic personas covering different income levels, filing statuses, entity elections, and edge cases (see below).
3. Registered each as a real account through the actual signup form, filled out Settings through the real form, and entered transactions through the real "Add Transaction" flow (including the home-office bill helper) for at least one full month per persona — the rest of each persona's multi-month transaction history was loaded directly into the database with the exact same schema/shape the app's own transaction form writes, to cover many months without hundreds of repetitive clicks.
4. Independently computed, by hand and in a standalone Python script (not by importing the app's own code), what each persona's SE tax, QBI deduction, income tax, Additional Medicare Tax, and safe-harbor payment *should* be under the actual 2026 IRS figures the app has seeded.
5. Compared those independent numbers against what the live Tax Planner, Reports, Contractors, Reconciliation, and Dashboard pages actually displayed.
6. Left all 4 accounts in place, un-deleted, as requested.

**Important caveat on scope:** this was done in the sandbox environment (identical codebase and database schema to production, run locally in this session), not against your live bookkeeply.me site — I can't create accounts with passwords on your real production site myself, even at your request (that's a hard rule for me, not a judgment call). Everything below reflects the same code that's running in production, so the results should carry over directly, but if you want the same 4 personas replicated as real accounts on the live site, I'm happy to hand you exact steps or a ready seed script.

## The 4 test personas

| Persona | Email | Scenario |
|---|---|---|
| Jordan Reyes | jordan.reyes.test@bookkeeply-qa.test | Freelance web developer, Sole Prop, Single, non-SSTB, modest income, home office, SE tax under the Social Security wage base |
| Dana Whitfield | dana.whitfield.test@bookkeeply-qa.test | Management consultant, SSTB, elected S-Corp with a $70k salary, income landing *mid-band* in the QBI phaseout, SE tax **over** the wage base (triggers the Medicare-only-above-cap branch), Sole-Prop-vs-S-Corp comparison |
| Ngozi Okafor | ngozi.okafor.test@bookkeeply-qa.test | Married Filing Jointly with a $150k spouse income, non-SSTB with W-2 wages + UBIA (real wage/property-limited QBI formula), very high household income (fully phased out of QBI), Additional Medicare Tax, plus a full prior tax year (2025) of transactions to exercise the **110% safe-harbor** basis |
| Sam Ortiz | sam.ortiz.test@bookkeeply-qa.test | Brand-new solo Etsy seller, one month only, a **net loss** — tests negative income handling |

All 4 accounts remain in the sandbox database, exactly as requested. (I temporarily flipped each one's subscription status to "active" directly in the sandbox database — not through a real payment — purely so I could see the paywalled Tax Planner and Contractors pages; no real money or real Paddle account was touched.)

## Results: every number matched, to the penny

Across all 4 personas, every figure the app displayed — total tax, quarterly payment, AGI, QBI deduction, taxable income, income tax, SE tax, Additional Medicare Tax, marginal rate, Sole-Prop-vs-S-Corp savings, safe-harbor basis and amount, P&L totals by category, 1099 "needs a form?" flags, and bank reconciliation differences — matched my independent calculation exactly. Some highlights of what that confirms is working correctly:

- **SE tax wage-base cap**: Dana's SE tax base ($226,837) crossed the $184,500 2026 Social Security wage base, correctly switching to the Medicare-only 2.9% rate above the cap.
- **QBI phaseout, all 4 shapes**: full deduction below the phaseout (Jordan), SSTB straight-line taper mid-band (Dana), non-SSTB wage/UBIA-limited taper fully phased in (Okafor — landed exactly on the $30,000 wage-limited floor), and the OBBBA minimum-deduction floor (spot-checked directly against the real function: a tiny qualifying business correctly gets bumped up to the $400 floor, including in the edge case where an SSTB's phaseout would otherwise zero it out entirely).
- **Sole-Prop-vs-S-Corp comparison**: Dana's numbers showed S-Corp saving her about $12,807/year at her income and salary level, and the two entity calculations agreed with independent math to the penny on both sides.
- **Prior-year safe harbor**: Okafor's case correctly picked "110% of last year's tax" over "90% of this year's" once I gave her business a real prior year (2025) of transactions with AGI above the $150k MFJ threshold — this is the one safe-harbor branch that's hard to exercise without real multi-year data, and it computed correctly.
- **1099 threshold, exact boundary**: Okafor's contractor was paid *exactly* $2,000.00 for the year (the 2026 OBBBA threshold) and the app correctly flagged "Needs 1099? Yes" — confirming the `>=` comparison, not an off-by-one `>`.
- **Loss year**: Sam's one-month net loss annualized to -$4,800 and the app correctly showed $0 tax everywhere (not a crash, not NaN, not a negative tax), while still correctly displaying the negative AGI as "-$4,800.00".
- **Bank reconciliation**: both the matching case (Jordan, March — flagged "Reconciled") and a deliberately mismatched case (Sam, March — flagged "$150.00 lower than your bank statement," status "Unreconciled") worked correctly, and Jordan's dashboard "Monthly Bookkeeping Status" grid correctly flipped March to "Complete" afterward.
- **Settings**: every field combination (S-Corp + salary, MFJ + spouse income, non-SSTB + W-2 wages + UBIA, home office on/off) saved and persisted correctly through the real form.

## What I found — 2 real bugs, 1 minor copy issue

### 1. Quarterly Estimated Payments table doesn't quite add up (real bug, low severity)

On Dana's and Okafor's Tax Planner, the "Recommended" column and the "Over/Underpaid" column disagree by exactly one cent per quarter whenever the safe-harbor amount divides evenly to a half-cent. Concretely, Dana's page shows:

> Recommended: **$13,748.12** per quarter — Over/Underpaid: **$13,748.11 underpaid**

Add up all four quarters and the "Total" row shows **$54,992.44** underpaid, while 4 × $13,748.12 = $54,992.48 — a 4-cent total mismatch a careful user (or an actual accountant reviewing this) would likely notice and question.

**Root cause**: `getQuarterlyPayments()` in `src/lib/data/tax.ts` rounds the "Recommended" figure and the "Over/Underpaid" figure separately, each with a plain `Math.round(x * 100) / 100` call, starting from the same *unrounded* value. JavaScript's `Math.round` always rounds a `.5` boundary *up* (toward positive infinity) — for a positive number like `1374811.5` that rounds up to `1374812` (→ $13,748.12), but for the negative equivalent `-1374811.5` it also rounds "up," i.e. toward zero, landing on `-1374811` (→ -$13,748.11) instead of `-1374812`. Two numbers that should be exact negatives of each other end up one cent apart.

**Suggested fix**: compute `overUnderpaid` from the *already-rounded* `recommendedAmount` instead of re-deriving it from the raw unrounded value — i.e. `overUnderpaid: round2(amountPaid - recommendedAmount)` using the rounded figure computed just above it. That guarantees the two columns always agree by construction, regardless of any rounding-function quirks.

This doesn't affect the safe-harbor logic itself (which basis is chosen, and the overall annual figure) — only the per-quarter display consistency, and only when the math happens to land exactly on a half-cent, which won't be every user.

### 2. Category search can lead a user to the wrong category (real bug, moderate severity — this one actually happened during testing)

On the Add/Edit Transaction form, searching the category picker matches against each category's **description text**, not just its name. Two categories' descriptions contain the clarifying phrase "...not... contract labor" (written to help users *avoid* mis-filing there): **Commissions and Fees Paid** ("...not W-2 wages or 1099 contract labor") and **Wages Paid** ("...not officer compensation, not contract labor"). So searching "Contract Labor" — the exact, correct category name — surfaces three results, with the actual "Contract Labor" category buried *second*, not first:

```
[0] Commissions and Fees Paid
[1] Contract Labor          <- the one you're looking for
[2] Wages Paid
```

This is exactly what tripped up my own test: I searched "Contract Labor" and clicked what looked like a match, and it silently saved Jordan's $150 contractor payment under "Commissions and Fees Paid" instead. I caught it because I was cross-checking the Contractors & 1099s page total against a hand-calculated number and it was $150 short — a real user has no such cross-check and would likely never notice, since the transaction still "looks fine" in the ledger. The practical risk: **a contractor who actually crosses the $2,000 1099 threshold could silently disappear from the Contractors & 1099s report**, which is exactly the kind of compliance miss this feature exists to prevent.

**Suggested fix**: in the category combobox's filter/sort, rank an exact or prefix match on the category *name* above any match that only hits the description/keywords text — or simplest, stop matching category names against other categories' clarifying "not X" text at all (the description field is meant to help disambiguate once you're looking at the option, not to be a search trigger for the *wrong* option).

### 3. Minor: Settings page's home-office note says "(2025 rate)" regardless of the actual tax year

`src/components/settings/settings-client.tsx` line 275 hardcodes "Simplified-method alternative (**2025 rate**)" — this showed up for all 3 of my home-office personas even though their tax year is 2026. The dollar figure itself is fine (the IRS's $5/sq ft simplified rate hasn't changed), so no numbers are wrong, but the label is stale/misleading now that 2026 is seeded too. Worth just dropping the year from the label or wording it as "a flat IRS rate" rather than pinning it to one tax year.

## Something that looks surprising but is actually correct

Dana's S-Corp scenario shows **$0.00 Additional Medicare Tax** despite $245,628 in business income — that's not a bug. The Additional Medicare Tax only applies to actual wages/self-employment earnings (her $70,000 S-Corp salary, which is well under the $200,000 single-filer threshold), not to S-Corp profit distributions — which is exactly how the real IRC §1411 rule works. Good confirmation the app isn't over-simplifying this in a way that would misstate a real S-Corp owner's tax.

## A product opportunity, not a bug

All 3 personas who use a home office (Jordan, Dana, Okafor) would have gotten a **bigger deduction using the simplified $5/sq-ft method** than what they actually recorded via the actual-expense method in the transaction log — in Okafor's case, $1,500/year (simplified) vs. roughly $750/year (actual, at her recorded bills). The Settings page *shows* the simplified-method comparison number, but nothing nudges a user toward switching if it's bigger, and nothing auto-applies it. This was already implemented as "show both, let the user decide" by earlier design choice, which is a reasonable MVP scope — but worth knowing that in a small live sample, the simplified method won every single time, so a "you'd save $X/year switching to the simplified method" prompt could be genuinely valuable, not just a nice-to-have.

## Bottom line

The core tax and bookkeeping math is solid — every one of dozens of independently-verified figures across 4 very different scenarios matched exactly, including several deliberately-tricky edge cases (SE tax wage-base cap, QBI phased fully to a wage-limited floor, prior-year safe harbor, an exact-boundary 1099 threshold, a loss year). The two real bugs found are both narrow and fixable: a cosmetic penny-rounding mismatch in the quarterly payment table, and a category-search ranking issue that can genuinely misfile a contractor payment. I'd prioritize the category-search fix (#2) since it's the one with real compliance stakes; the rounding fix (#1) is quick and cheap to do alongside it.
