"use server";

import { list, del } from "@vercel/blob";
import { requireFounder } from "@/lib/current-business";

export type MediaImage = {
  url: string;
  pathname: string;
  /** ISO string -- Date objects can't cross the server action boundary. */
  uploadedAt: string;
  size: number;
};

/**
 * Every image ever uploaded through the blog's image picker, newest first.
 * Reads straight from the Blob store rather than a database table -- see
 * the comment in src/app/api/blog/upload/route.ts for why there isn't one.
 */
export async function listBlogImagesAction(): Promise<MediaImage[]> {
  await requireFounder();
  const { blobs } = await list({ prefix: "blog/" });
  return blobs
    .map((blob) => ({
      url: blob.url,
      pathname: blob.pathname,
      uploadedAt: blob.uploadedAt.toISOString(),
      size: blob.size,
    }))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

/**
 * Removes an image from storage. Doesn't check whether a post still
 * references it -- the picker's confirm prompt warns about that instead of
 * paying for a query across every post's content on every delete.
 */
export async function deleteBlogImageAction(url: string): Promise<void> {
  await requireFounder();
  await del(url);
}
