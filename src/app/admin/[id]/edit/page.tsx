import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/post-form";
import { getPostById } from "@/lib/blog";
import { updatePostAction } from "@/lib/actions/blog-actions";

export default async function EditPostPage(props: PageProps<"/admin/[id]/edit">) {
  const { id } = await props.params;
  const post = await getPostById(id);
  if (!post) notFound();

  const action = updatePostAction.bind(null, post.id);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Edit post</h1>
      <div className="mt-6">
        <PostForm
          action={action}
          submitLabel="Save changes"
          initial={{
            title: post.title,
            slug: post.slug,
            description: post.description,
            content: post.content,
            published: post.published,
          }}
        />
      </div>
    </div>
  );
}
