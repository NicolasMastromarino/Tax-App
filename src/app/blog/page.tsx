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

        {/* Post list, floating up over the bottom of the banner */}
        <div className="relative mx-auto -mt-10 w-full max-w-3xl px-4 pb-16 sm:-mt-12 sm:px-6">
          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-lg">
              <p className="text-sm text-muted">No posts yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group rounded-2xl border border-border bg-surface p-6 shadow-lg transition-shadow hover:shadow-xl sm:p-7"
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
