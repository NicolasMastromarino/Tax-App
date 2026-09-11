import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getAllPosts } from "@/lib/blog";

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

export default async function BlogIndexPage() {
  const posts = await getAllPosts();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="marketing-dot-grid relative overflow-hidden border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 70%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-muted shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              From the Bookkeeply team
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              The Blog
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-lg text-muted">
              Bookkeeping and tax-planning notes for freelancers and service-based businesses.
            </p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          {posts.length === 0 ? (
            <p className="text-center text-sm text-muted">No posts yet. Check back soon.</p>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md sm:p-7"
                >
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted">
                        {formatDate(post.publishedAt)}
                      </p>
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
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
