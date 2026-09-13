/**
 * One-off content fix for "How Much Should a Freelancer Set Aside for
 * Taxes?" (slug: how-much-should-a-freelancer-set-aside-for-taxes).
 *
 * Applies the PostSlugPolish design pass, none of which changes the post's
 * wording:
 *   1. Removes the duplicate title paragraph that repeated the page's <h1>
 *      at the top of the article body.
 *   2. Wraps the four standalone bold "equation" lines in the editor's new
 *      Callout block (a quiet bordered/tinted box) instead of leaving them
 *      as plain bold paragraphs.
 *   3. Replaces the six raw "| Monthly Profit | ... |" markdown-table
 *      paragraphs (previously rendering as literal pipe characters) with a
 *      real <table>.
 *   4. Wraps the trailing tax-disclaimer paragraph in the editor's new
 *      Disclaimer block (divider + small info icon) instead of a plain
 *      paragraph.
 *   5. Italicizes the two "this is only a planning estimate" / "these are
 *      planning examples" caveat sentences as their own full paragraphs (no
 *      partial bold), so they pick up the fine-print caption style (smaller,
 *      lighter gray, extra top space) that blog/[slug]/page.tsx now applies
 *      to any paragraph that's entirely wrapped in <em>.
 *   6. Sets the post's category to "Taxes" (see src/lib/blog-categories.ts).
 *
 * The content in fix-freelancer-tax-post.content.html uses the real
 * `data-type="callout"` / `data-type="disclaimer"` markup the rich-text
 * editor's toolbar now produces (src/components/admin/blog-extensions.ts),
 * so re-opening this post in /admin and saving it again keeps these
 * treatments intact instead of flattening them to plain paragraphs.
 *
 * Safe to re-run: it always sets content/category to the same values. Run
 * with:
 *   npx tsx scripts/fix-freelancer-tax-post.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "../src/db";
import { blogPosts } from "../src/db/schema";
import { eq } from "drizzle-orm";

const SLUG = "how-much-should-a-freelancer-set-aside-for-taxes";
const CATEGORY = "Taxes";

async function main() {
  const fixedContent = readFileSync(
    path.join(__dirname, "fix-freelancer-tax-post.content.html"),
    "utf-8"
  );

  const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.slug, SLUG));
  if (!existing) {
    throw new Error(`No blog post found with slug "${SLUG}".`);
  }

  console.log(`Found post: "${existing.title}" (id ${existing.id})`);
  console.log(`Current content length: ${existing.content.length}`);
  console.log(`New content length:     ${fixedContent.length}`);
  console.log(`Current category:       ${existing.category ?? "(none)"}`);
  console.log(`New category:           ${CATEGORY}`);

  if (existing.content === fixedContent && existing.category === CATEGORY) {
    console.log("Content and category already match -- nothing to do.");
    process.exit(0);
  }

  await db
    .update(blogPosts)
    .set({ content: fixedContent, category: CATEGORY, updatedAt: new Date() })
    .where(eq(blogPosts.slug, SLUG));

  console.log("Updated. Verifying...");
  const [after] = await db.select().from(blogPosts).where(eq(blogPosts.slug, SLUG));
  if (after?.content !== fixedContent || after?.category !== CATEGORY) {
    throw new Error("Verification failed: stored content/category does not match what we wrote.");
  }
  console.log("Verified -- the post's content and category now match.");
  process.exit(0);
}

main().catch((err) => {
  console.error("FAILED:", err);
  process.exit(1);
});
