import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getAllPosts, type BlogPostListItem } from "@/lib/blog";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { localizedPath, type Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [dict, locale] = await Promise.all([getDictionary(), getLocale()]);
  const { title, description } = dict.seo.blog;
  const alternates = localizedAlternates(locale, "/blog");
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      siteName: "Bookkeeply",
      type: "website",
      locale: locale === "es" ? "es_US" : "en_US",
      url: alternates.canonical as string,
      images: [{ url: "/marketing/og-image.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: ["/marketing/og-image.png"] },
  };
}

// Post content itself (title/body) is English-only for now -- see the i18n
// plan's scope note on editorial content -- but the date is still worth
// formatting per the viewer's locale.
function formatDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === "es" ? "es" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Short "Sep 5" form used in the compact list cards -- no year, no "read". */
function formatDateShort(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === "es" ? "es" : "en-US", {
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
function FeaturedPostCard({ post, locale, t }: { post: BlogPostListItem; locale: Locale; t: Dictionary["blog"] }) {
  return (
    <Link
      href={localizedPath(locale, `/blog/${post.slug}`)}
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
            {formatDate(post.publishedAt, locale)} &middot; {post.readingTime} {t.minRead}
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
          {t.readMore}
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
function CompactPostCard({ post, locale, t }: { post: BlogPostListItem; locale: Locale; t: Dictionary["blog"] }) {
  return (
    <Link
      href={localizedPath(locale, `/blog/${post.slug}`)}
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
            {formatDateShort(post.publishedAt, locale)} &middot; {post.readingTime} {t.minReadShort}
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
  const [posts, dict, locale] = await Promise.all([getAllPosts(), getDictionary(), getLocale()]);
  const [featured, ...rest] = posts;
  const t = dict.blog;

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
              {t.teamBadge}
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {t.heading}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-white/80">{t.subtitle}</p>
          </div>
        </section>

        {/* Post list, floating up over the bottom of the banner. The newest
            post gets the full-width featured card; older posts use the
            compact left-thumbnail card, per the BlogListRefinedThumbLeft
            design (see claude/blog-content-guidelines.md). */}
        <div className="relative mx-auto -mt-10 w-full max-w-3xl px-4 pb-16 sm:-mt-12 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-lg">
              <p className="text-sm text-muted">{t.emptyState}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <FeaturedPostCard post={featured} locale={locale} t={t} />
              {rest.map((post) => (
                <CompactPostCard key={post.slug} post={post} locale={locale} t={t} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
