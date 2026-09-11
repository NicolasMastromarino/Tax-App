import { PostForm } from "@/components/admin/post-form";
import { createPostAction } from "@/lib/actions/blog-actions";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">New post</h1>
      <div className="mt-6">
        <PostForm action={createPostAction} submitLabel="Create post" />
      </div>
    </div>
  );
}
