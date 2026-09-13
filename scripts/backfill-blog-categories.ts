/**
 * One-off backfill: sets a category (src/lib/blog-categories.ts) on the two
 * starter posts seeded before the `category` column existed. Any other post
 * without a category (e.g. one created from /admin before you started
 * picking one) is left alone -- the /blog card and post header just skip
 * the category pill when it's null, so this is optional polish, not a
 * required migration step.
 *
 * Safe to re-run. Run with:
 *   npx tsx scripts/backfill-blog-categories.ts
 */
import "dotenv/config";
import { db } from "../src/db";
import { blogPosts } from "../src/db/schema";
import { eq } from "drizzle-orm";

const CATEGORY_BY_SLUG: Record<string, string> = {
  "welcome-to-the-bookkeeply-blog": "Announcements",
  "quarterly-estimated-taxes-the-basics": "Taxes",
};

async function main() {
  for (const [slug, category] of Object.entries(CATEGORY_BY_SLUG)) {
    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    if (!existing) {
      console.log(`Skipping "${slug}" -- no post with that slug.`);
      continue;
    }
    if (existing.category === category) {
      console.log(`"${slug}" already set to "${category}" -- skipping.`);
      continue;
    }
    await db.update(blogPosts).set({ category, updatedAt: new Date() }).where(eq(blogPosts.slug, slug));
    console.log(`"${slug}": category set to "${category}".`);
  }
  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
