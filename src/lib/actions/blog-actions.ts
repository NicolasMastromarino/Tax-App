"use server";

import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireFounder } from "@/lib/current-business";
import { blogPostSchema } from "@/lib/validations";
import type { ZodError } from "zod";

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
    category: formData.get("category") ?? "",
    featuredImage: formData.get("featuredImage") ?? "",
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
      category: parsed.data.category || null,
      featuredImage: parsed.data.featuredImage || null,
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
      category: parsed.data.category || null,
      featuredImage: parsed.data.featuredImage || null,
      published: parsed.data.published,
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));

  revalidateBlogPaths(parsed.data.slug);
  redirect("/admin");
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
