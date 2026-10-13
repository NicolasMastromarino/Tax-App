/**
 * Search-snippet overrides for individual blog posts, keyed by slug.
 *
 * These only change what search engines and social cards see (<title>,
 * meta description, Open Graph/Twitter, Article JSON-LD description). The
 * post's on-page H1, the /blog cards and the /admin editor keep using the
 * row's own title/description.
 *
 * Use this when Search Console data shows a post's snippet is losing clicks
 * (title truncated, description that doesn't answer the query) and the row
 * itself hasn't been edited yet. Once the row in /admin carries the same
 * copy, delete its entry here so there's one source of truth again.
 */
export type BlogSeoOverride = { title?: string; description?: string };

export const BLOG_SEO_OVERRIDES: Record<string, BlogSeoOverride> = {
  // Top-impression post; the 81-char row title gets cut off in results, and the
  // queries it shows for are "safe harbor rule", "irs safe harbor", "110 estimated tax rule".
  "the-irs-safe-harbor-rule-how-to-avoid-a-penalty-without-overpaying-every-quarter": {
    title: "IRS Safe Harbor Rule: The 100%/110% Test to Avoid Penalties",
    description:
      "The IRS safe harbor rule explained: pay 100% of last year's tax (110% for higher earners) or 90% of this year's to avoid an underpayment penalty.",
  },
  // Exact-match query "how much should a freelancer set aside for taxes" ranks ~24;
  // the row description is a body excerpt that never states the answer.
  "how-much-should-a-freelancer-set-aside-for-taxes": {
    description:
      "How much should a freelancer set aside for taxes? Why 25% to 30% of profit is a common starting point, with a simple example and how to adjust it.",
  },
  // Avg position ~7 with no clicks: give the snippet a concrete promise.
  "you-made-100000-how-much-of-it-is-actually-yours": {
    description:
      "Made $100,000 self-employed? See how much you might keep after expenses, self-employment tax and income tax, with a simple worked example.",
  },
};

export function blogSeo(post: { slug: string; title: string; description: string }) {
  const override = BLOG_SEO_OVERRIDES[post.slug];
  return {
    title: override?.title ?? post.title,
    description: override?.description ?? post.description,
  };
}
