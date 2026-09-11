import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * Minimal file-based blog: posts are markdown files with frontmatter in
 * src/content/blog/*.md, rendered at /blog and /blog/[slug]. No CMS, no
 * separate hosting or database — add a new .md file here and it shows up.
 *
 * This intentionally does NOT sanitize the rendered HTML: post files are
 * only ever added by whoever has repo access (not user-submitted content),
 * so treating them as trusted markup is safe. Never wire this up to accept
 * post content from an untrusted source without adding sanitization first.
 */

const POSTS_DIR = path.join(process.cwd(), "src/content/blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO date string, e.g. "2026-09-11"
};

export type BlogPost = BlogPostMeta & {
  html: string;
};

function readSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

function readPost(slug: string): BlogPost | null {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" ? data.title : slug;
  const description = typeof data.description === "string" ? data.description : "";
  const date = typeof data.date === "string" ? data.date : new Date(0).toISOString();

  return {
    slug,
    title,
    description,
    date,
    html: marked.parse(content, { async: false }) as string,
  };
}

/** All posts, newest first, for the /blog index. Doesn't include rendered HTML. */
export function getAllPosts(): BlogPostMeta[] {
  return readSlugs()
    .map((slug) => readPost(slug))
    .filter((post): post is BlogPost => post !== null)
    .map(({ slug, title, description, date }) => ({ slug, title, description, date }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** A single post with rendered HTML, for /blog/[slug]. */
export function getPostBySlug(slug: string): BlogPost | null {
  return readPost(slug);
}
