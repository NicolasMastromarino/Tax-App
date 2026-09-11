/**
 * Starter blog posts, ported from the blog's original file-based version
 * (src/content/blog/*.md, now removed in favor of storing posts in the
 * database and editing them from /admin). Seeded once via `npm run db:seed`
 * with onConflictDoNothing on slug, so re-running the seed never overwrites
 * edits made afterward through the admin editor.
 */

export const BLOG_POST_SEED = [
  {
    slug: "welcome-to-the-bookkeeply-blog",
    title: "Welcome to the Bookkeeply Blog",
    description:
      "Why we're writing this, and what to expect: practical bookkeeping and tax-planning notes for freelancers and service-based businesses.",
    published: true,
    content: `If you're a freelancer or run a small service-based business, you probably didn't get into this to become your own bookkeeper. Most people don't. But the bookkeeping and tax side of running a business has a way of becoming urgent right when you have the least time for it, usually a few days before a quarterly payment is due.

This blog is where we'll write about that side of things: how to think about quarterly estimated taxes, what the QBI deduction actually means for a sole proprietor or S-Corp, how to keep a clean set of books without spending hours on it every week, and general updates on IRS rules that affect freelancers and one-person service businesses.

A couple of things worth saying up front. First, nothing here is a substitute for advice from a licensed CPA or tax professional who knows your specific situation. We'll try to be accurate and cite where figures come from, but tax rules have a lot of edge cases, and this blog is about general concepts, not a review of your return. Second, we're going to keep posts short and practical. If a topic needs a wall of text to explain, that's usually a sign the underlying process is more complicated than it needs to be, and we'd rather point that out than write around it.

If there's a topic you'd like us to cover, from the mechanics of self-employment tax to how to handle a slow month, let us know at [support@bookkeeply.me](mailto:support@bookkeeply.me).`,
  },
  {
    slug: "quarterly-estimated-taxes-the-basics",
    title: "Quarterly Estimated Taxes: The Basics",
    description:
      "A plain-English overview of why freelancers pay taxes four times a year, and how the safe-harbor rule keeps you from guessing.",
    published: true,
    content: `If you're used to a W-2 job, taxes happen automatically: your employer withholds a slice of every paycheck and sends it to the IRS on your behalf. When you're self-employed, that withholding doesn't exist, so the IRS asks you to send in estimated payments yourself, four times a year, roughly matching what would have been withheld if you had an employer.

**Why four payments instead of one at tax time?** The U.S. tax system is "pay as you go." If you wait until April to pay everything you owe for the prior year, the IRS can charge an underpayment penalty on top of the tax itself, even if you pay in full by the deadline. Spreading payments across the year avoids that.

**How much should each payment be?** This is where the "safe-harbor" rule comes in. In general, you're considered safely paid up if your total withholding and estimated payments for the year equal the smaller of two numbers: 90% of what you'll actually owe for the current year, or 100% (110% if your prior-year income was high) of what you owed last year. The second option is often easier to plan around, since last year's tax bill is already a known number, while this year's is still a projection.

**What if my income is uneven month to month?** This is the norm for most freelancers and service businesses, and it's exactly why a running bookkeeping habit matters more than a once-a-year scramble. If you're tracking income and expenses as you go, your estimated tax number updates with reality instead of being a guess made in January and hoped to hold until April.

None of this is a substitute for advice from a licensed CPA about your specific situation, especially if your income is unusual this year (a big one-time contract, a slow stretch, a change in business structure). But for a straightforward sole proprietorship or single-owner S-Corp, the mechanics above cover most of what actually matters day to day.`,
  },
] as const;
