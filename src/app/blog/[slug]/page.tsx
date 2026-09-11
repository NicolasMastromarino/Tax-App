import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader, SiteFooter } from "@/components/marketing/landing-page";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6">
        <Link href="/blog" className="text-sm font-medium text-primary hover:underline">
          &larr; Back to blog
        </Link>

        <article className="mt-6">
          {!post.published && (
            <p className="mb-3 inline-block rounded-full bg-warning-bg px-3 py-1 text-xs font-semibold text-warning">
              Draft &mdash; not listed on /blog yet
            </p>
          )}
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {formatDate(post.publishedAt)}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {post.title}
          </h1>

          <div
            className="prose-content mt-8 text-foreground
              [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-foreground
              [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground
              [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground
              [&_h4]:mt-6 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground
              [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-foreground
              [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6
              [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-6
              [&_li]:leading-relaxed
              [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-hover
              [&_strong]:font-semibold [&_strong]:text-foreground
              [&_em]:italic
              [&_u]:underline
              [&_s]:line-through
              [&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
              [&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-muted [&_pre]:p-4 [&_pre]:text-sm [&_pre_code]:bg-transparent [&_pre_code]:p-0
              [&_blockquote]:mt-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted
              [&_hr]:my-8 [&_hr]:border-border
              [&_img]:mt-6 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-border
              [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-xs [&_figcaption]:text-muted"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
