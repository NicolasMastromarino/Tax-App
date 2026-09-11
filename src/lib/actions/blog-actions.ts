"use server";

import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFounder } from "@/lib/current-business";
import { blogPostSchema } from "@/lib/validations";
import type { ZodError } from "zod";
import { put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export interface BlogActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseForm(formData: FormData) {
  return blogPostSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    content: formData.get("content"),
    published: formData.get("published") === "on",
  });
}

function fieldErrorsFrom(error: ZodError) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

function revalidateBlogPaths(slug?: string) {
  revalidatePath("/blog");
  if (slug) revalidatePath(`/blog/${slug}`);
}

export async function createPostAction(
  _prevState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  await requireFounder();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, parsed.data.slug))
    .limit(1);
  if (existing) {
    return { fieldErrors: { slug: "That slug is already used by another post." } };
  }

  const [post] = await db
    .insert(blogPosts)
    .values({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || "",
      content: parsed.data.content,
      published: parsed.data.published,
    })
    .returning({ id: blogPosts.id, slug: blogPosts.slug });

  revalidateBlogPaths(post.slug);
  redirect("/admin");
}

export async function updatePostAction(
  id: string,
  _prevState: BlogActionState,
  formData: FormData
): Promise<BlogActionState> {
  await requireFounder();
  const parsed = parseForm(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const [existing] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, parsed.data.slug), ne(blogPosts.id, id)))
    .limit(1);
  if (existing) {
    return { fieldErrors: { slug: "That slug is already used by another post." } };
  }

  await db
    .update(blogPosts)
    .set({
      title: parsed.data.title,
      slug: parsed.data.slug,
      description: parsed.data.description || "",
      content: parsed.data.content,
      published: parsed.data.published,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidateBlogPaths(parsed.data.slug);
  redirect("/admin");
}

/**
 * Uploads an image dropped into the post editor's image button to Vercel
 * Blob storage and returns its public URL to insert into the post content.
 * Requires a Blob store connected to the Vercel project (Dashboard ->
 * Storage -> Create Database -> Blob), which sets BLOB_READ_WRITE_TOKEN
 * automatically; without it this returns a clear error instead of crashing,
 * since local dev won't have that env var unless pulled with `vercel env
 * pull`.
 */
export async function uploadBlogImageAction(
  formData: FormData
): Promise<{ url: string } | { error: string }> {
  await requireFounder();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      error:
        "Image storage isn't set up yet. Add Blob storage to this project in the Vercel dashboard (Storage -> Create Database -> Blob), then redeploy.",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No image selected." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { error: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image is too large (8MB max)." };
  }

  const extension = file.type.split("/")[1];
  const filename = `blog/${crypto.randomUUID()}.${extension}`;

  try {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return { url: blob.url };
  } catch (err) {
    console.error("Blog image upload failed:", err);
    return { error: "Upload failed. Try again." };
  }
}

export async function deletePostAction(id: string): Promise<void> {
  await requireFounder();
  const [deleted] = await db
    .delete(blogPosts)
    .where(eq(blogPosts.id, id))
    .returning({ slug: blogPosts.slug });

  revalidateBlogPaths(deleted?.slug);
  redirect("/admin");
}
