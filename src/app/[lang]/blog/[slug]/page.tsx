import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getPostBySlug, readingTime } from "@/lib/blog";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { defaultLocale, localizedPath, type Locale } from "@/i18n/locales";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";

// No generateStaticParams here: this route is nested under [lang], which has
// no generateStaticParams of its own (locale is resolved per-request by
// src/proxy.ts), so a partial { slug } param set without `lang` breaks
// Next's static-generation bookkeeping for this route and 500s at runtime
// (regression found in prod after the i18n restructure). Fully dynamic
// rendering — same as the /blog listing page, which has never had
// generateStaticParams and works fine — sidesteps the whole problem.

export async function generateMetadata(
  props: PageProps<"/[lang]/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const locale = await getLocale();
  // Post bodies are English-only, so /es/blog/<slug> is the same article
  // under a Spanish shell: canonicalize it to the English URL instead of
  // advertising two competing versions.
  const canonical = localizedPath(defaultLocale, `/blog/${slug}`);
  const images = post.featuredImage ? [{ url: post.featuredImage }] : [{ url: "/marketing/og-image.png", width: 1200, height: 630 }];
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    // A draft can be opened by URL (see draftNotice below): keep it out of the index.
    robots: post.published ? undefined : { index: false, follow: false },
    openGraph: {
      title: post.title,
      description: post.description,
      siteName: "Bookkeeply",
      type: "article",
      locale: locale === "es" ? "es_US" : "en_US",
      url: canonical,
      publishedTime: post.publishedAt.toISOString(),
      section: post.category ?? undefined,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: images.map((i) => i.url),
    },
  };
}

function formatDate(date: Date, locale: Locale) {
  return date.toLocaleDateString(locale === "es" ? "es" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage(props: PageProps<"/[lang]/blog/[slug]">) {
  const { slug } = await props.params;
  const [post, dict, locale] = await Promise.all([getPostBySlug(slug), getDictionary(), getLocale()]);
  if (!post) notFound();

  const minutes = readingTime(post.html);
  const t = dict.blog;
  const postUrl = absoluteUrl(defaultLocale, `/blog/${slug}`);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.description,
          datePublished: post.publishedAt.toISOString(),
          image: post.featuredImage ? new URL(post.featuredImage, postUrl).toString() : undefined,
          inLanguage: "en",
          mainEntityOfPage: postUrl,
          author: { "@type": "Organization", name: "Bookkeeply" },
          publisher: { "@type": "Organization", name: "Bookkeeply" },
        }}
      />
      <main className="flex-1">
        {/* Gradient header, matching the blog index and login page's brand gradient */}
        <section
          className="relative overflow-hidden py-10 sm:py-14"
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
          <div className="relative mx-auto max-w-[720px] px-4 sm:px-6">
            <Link
              href={localizedPath(locale, "/blog")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-white/85 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {t.backToBlog}
            </Link>

            {!post.published && (
              <p className="mt-4 inline-block rounded-full bg-white/16 px-3 py-1 text-xs font-semibold text-white">
                {t.draftNotice}
              </p>
            )}

            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-white/80">
              <span>{formatDate(post.publishedAt, locale)}</span>
              <span aria-hidden="true">&middot;</span>
              <span>
                {minutes} {t.minRead}
              </span>
            </div>
            {post.description && (
              <p className="mt-4 max-w-2xl text-pretty text-lg text-white/85">{post.description}</p>
            )}
          </div>
        </section>

        {post.featuredImage && (
          <div className="relative mx-auto -mt-8 w-full max-w-[720px] px-4 sm:-mt-10 sm:px-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered path/URL, not a static app asset */}
            <img
              src={post.featuredImage}
              alt=""
              className="aspect-[2/1] w-full rounded-2xl border border-border object-cover shadow-lg"
            />
          </div>
        )}

        <article className="mx-auto max-w-[720px] px-4 pt-12 pb-12 sm:px-6 sm:pb-16">
          <div
            className="prose-content text-base leading-7 text-muted sm:text-lg sm:leading-8
              [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground sm:[&_h2]:text-2xl
              [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground sm:[&_h3]:text-xl
              [&_h4]:mt-6 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground sm:[&_h4]:text-lg
              [&_h1]:mt-10 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground sm:[&_h1]:text-2xl
              [&_p]:mt-5 [&_p]:text-muted [&>p:first-child]:mt-0
              [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6
              [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6
              [&_li]:leading-7 [&_li]:text-muted sm:[&_li]:leading-8
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-hover
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_em]:italic
              [&_u]:underline
              [&_s]:line-through
              [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
              [&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-muted [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_blockquote]:mt-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted
              [&_hr]:my-10 [&_hr]:border-border
              [&_img]:mt-8 [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border [&_img]:shadow-sm
              [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted
              [&_table]:mt-5 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-[15px]
              [&_thead]:bg-surface-muted
              [&_th]:border [&_th]:border-border [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
              [&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-muted-table [&_td]:[font-variant-numeric:tabular-nums]
              [&_tbody_tr:nth-child(even)]:bg-surface-muted/40
              [&_.blog-callout]:mt-5 [&_.blog-callout]:flex [&_.blog-callout]:flex-col [&_.blog-callout]:gap-2 [&_.blog-callout]:rounded-xl [&_.blog-callout]:border [&_.blog-callout]:border-border [&_.blog-callout]:bg-background [&_.blog-callout]:px-5 [&_.blog-callout]:py-4
              [&_.blog-callout_p]:mt-0 [&_.blog-callout_p]:text-base [&_.blog-callout_p]:font-semibold [&_.blog-callout_p]:text-foreground [&_.blog-callout_p]:[font-variant-numeric:tabular-nums]
              [&_.blog-callout_p:last-child]:text-primary
              [&_.blog-disclaimer]:mt-10 [&_.blog-disclaimer]:flex [&_.blog-disclaimer]:items-start [&_.blog-disclaimer]:gap-2.5 [&_.blog-disclaimer]:border-t [&_.blog-disclaimer]:border-hairline [&_.blog-disclaimer]:pt-5
              [&_.blog-disclaimer_svg]:mt-0.5 [&_.blog-disclaimer_svg]:shrink-0 [&_.blog-disclaimer_svg]:text-muted-faintest
              [&_.blog-disclaimer_p]:mt-0 [&_.blog-disclaimer_p]:text-[13px] [&_.blog-disclaimer_p]:leading-[22px] [&_.blog-disclaimer_p]:italic [&_.blog-disclaimer_p]:text-muted-faintest
              [&_p:has(>em:only-child)]:mt-4 [&_p:has(>em:only-child)]:text-[15px] [&_p:has(>em:only-child)]:leading-[26px] [&_p:has(>em:only-child)]:text-muted-faint"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />

          <div className="relative mt-10 overflow-hidden rounded-2xl">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right in oklch, var(--primary), var(--marketing-accent))",
              }}
            />
            <div className="relative px-6 py-10 text-center sm:px-10">
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {t.cta.heading}
              </h2>
              <p className="mx-auto mt-3 max-w-md text-pretty text-white/90">{t.cta.body}</p>
              <Link
                href={localizedPath(locale, "/register")}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-primary shadow-md transition-transform hover:scale-[1.02]"
              >
                {t.cta.button}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
