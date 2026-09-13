// The blog's fixed set of categories, shown as a pill on the /blog index
// and post header. A plain constant list (not a Postgres enum) so adding
// or renaming one is a code change here, not a migration -- see the
// `category` column comment in src/db/schema.ts.
export const BLOG_CATEGORIES = ["Taxes", "Bookkeeping", "Freelancing", "Announcements"] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export function isBlogCategory(value: string | null | undefined): value is BlogCategory {
  return !!value && (BLOG_CATEGORIES as readonly string[]).includes(value);
}
