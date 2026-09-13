import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getAllPosts, type BlogPostListItem } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Bookkeeping and tax-planning notes for freelancers and service-based businesses.",
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Short "Sep 5" form used in the compact list cards -- no year, no "read". */
function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
      {category}
    </span>
  );
}

/** The most recent post, full-width with its image on top (PostSlugPolish's BlogListRefinedThumbLeft "A" card). */
function FeaturedPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-surface shadow-lg transition-shadow hover:shadow-xl"
    >
      {post.featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element -- admin-entered path/URL, not a static app asset
        <img
          src={post.featuredImage}
          alt=""
          className="aspect-[2/1] w-full object-cover"
        />
      )}
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && <CategoryPill category={post.category} />}
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatDate(post.publishedAt)} &middot; {post.readingTime} min read
          </span>
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-2xl">
          {post.title}
        </h2>
        {post.description && (
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted sm:text-base">
            {post.description}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          Read more
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

/** Older posts, compact with a small left-aligned thumbnail (the "A1" card). */
function CompactPostCard({ post }: { post: BlogPostListItem }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex items-start gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {post.featuredImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-entered path/URL, not a static app asset
        <img
          src={post.featuredImage}
          alt=""
          className="h-24 w-24 shrink-0 rounded-xl border border-border object-cover"
        />
      ) : (
        <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {post.category && <CategoryPill category={post.category} />}
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatDateShort(post.publishedAt)} &middot; {post.readingTime} min
          </span>
        </div>
        <h2 className="mt-2.5 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h2>
        {post.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {post.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function BlogIndexPage() {
  const posts = await getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1 bg-background">
        {/* Gradient hero banner, matching the login page's brand gradient */}
        <section
          className="relative overflow-hidden py-20 sm:py-24"
          style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1.5px, transparent 1.5px)",
              backgroundSize: "26px 26px",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              From the Bookkeeply team
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              The Blog
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/80">
              Bookkeeping and tax-planning notes for freelancers and service-based businesses.
            </p>
          </div>
        </section>

        {/* Post list, floating up over the bottom of the banner. The newest
            post gets the full-width featured card; older posts use the
            compact left-thumbnail card, per the BlogListRefinedThumbLeft
            design (see claude/blog-content-guidelines.md). */}
        <div className="relative mx-auto -mt-10 w-full max-w-3xl px-4 pb-16 sm:-mt-12 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-lg">
              <p className="text-sm text-muted">No posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <FeaturedPostCard post={featured} />
              {rest.map((post) => (
                <CompactPostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
