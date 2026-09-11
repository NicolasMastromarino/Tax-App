import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Bookkeeping and tax-planning notes for freelancers and service-based businesses.",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Blog</h1>
        <p className="mt-2 text-lg text-muted">
          Bookkeeping and tax-planning notes for freelancers and service-based businesses.
        </p>

        {posts.length === 0 ? (
          <p className="mt-10 text-sm text-muted">No posts yet. Check back soon.</p>
        ) : (
          <div className="mt-10 space-y-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {formatDate(post.date)}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                {post.description && (
                  <p className="mt-2 text-sm text-pretty text-muted">{post.description}</p>
                )}
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Read more &rarr;
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
