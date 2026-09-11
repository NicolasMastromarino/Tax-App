import Link from "next/link";
import { Plus } from "lucide-react";
import { getAllPostsForAdmin } from "@/lib/blog";
import { deletePostAction } from "@/lib/actions/blog-actions";
import { DeletePostButton } from "@/components/admin/delete-post-button";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminBlogListPage() {
  const posts = await getAllPostsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Blog posts</h1>
        <Link
          href="/admin/new"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className="mt-8 text-sm text-muted">
          No posts yet. Click &ldquo;New post&rdquo; to write your first one.
        </p>
      ) : (
        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-surface">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{post.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      post.published
                        ? "bg-success-bg text-success"
                        : "bg-warning-bg text-warning"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted">
                  /blog/{post.slug} &middot; {formatDate(post.publishedAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-medium text-muted hover:text-foreground"
                >
                  View
                </Link>
                <Link
                  href={`/admin/${post.id}/edit`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Edit
                </Link>
                <form action={deletePostAction.bind(null, post.id)}>
                  <DeletePostButton title={post.title} />
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
