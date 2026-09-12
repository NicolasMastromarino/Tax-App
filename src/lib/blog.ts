import "server-only";
import { marked } from "marked";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";

/**
 * The blog: posts are rows in blog_posts, written from /admin (gated to the
 * founder account, see requireFounder in src/lib/current-business.ts).
 *
 * `content` holds one of two formats, told apart in renderHtml(): older
 * posts (written before the /admin editor had a rich-text mode) are raw
 * markdown and go through `marked`; posts written with the rich-text
 * editor are already HTML (TipTap's editor.getHTML()) and pass through
 * unchanged. There's no migration step, both formats just keep working.
 *
 * This does NOT sanitize the rendered HTML: post content only ever comes
 * from the founder-gated /admin editor, not from public input, so treating
 * it as trusted markup is safe. Never wire a public-facing form into
 * createPost/updatePost without adding sanitization first.
 */

export type BlogPostMeta = {
  id: string;
  slug: string;
  title: string;
  description: string;
  published: boolean;
  publishedAt: Date;
};

export type BlogPost = BlogPostMeta & {
  content: string;
  html: string;
};

function renderHtml(content: string): string {
  // A leading "<" is a reliable enough signal: markdown almost never
  // starts with a raw tag, and every block TipTap's getHTML() emits does.
  if (content.trim().startsWith("<")) return content;
  return marked.parse(content, { async: false }) as string;
}

/** Published posts, newest first, for the public /blog index. */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      description: blogPosts.description,
      published: blogPosts.published,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.publishedAt));
  return rows;
}

/**
 * A single post by slug, with rendered HTML, for /blog/[slug]. Returns
 * unpublished (draft) posts too — there's no public listing or search
 * engine link to a draft, but a direct URL works as an unlisted preview.
 * See the `published` column comment in schema.ts for why that's an
 * acceptable simplification here.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  if (!row) return null;
  return { ...row, html: renderHtml(row.content) };
}

/** Every post regardless of published state, newest-created-first, for /admin. */
export async function getAllPostsForAdmin(): Promise<BlogPostMeta[]> {
  const rows = await db
    .select({
      id: blogPosts.id,
      slug: blogPosts.slug,
      title: blogPosts.title,
      description: blogPosts.description,
      published: blogPosts.published,
      publishedAt: blogPosts.publishedAt,
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.publishedAt));
  return rows;
}

/** A single post by id (including unrendered markdown), for the /admin edit form. */
export async function getPostById(id: string): Promise<BlogPost | null> {
  const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  if (!row) return null;
  return { ...row, html: renderHtml(row.content) };
}
