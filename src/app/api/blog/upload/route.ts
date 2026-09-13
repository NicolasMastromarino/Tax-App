import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isFounder } from "@/lib/data/subscription";
import { BLOG_IMAGE_CONTENT_TYPES } from "@/lib/media";

/**
 * Issues client-upload tokens for the blog's image picker (used from both
 * post-form.tsx's featured-image field and rich-text-editor.tsx's image
 * button) and gets pinged by Vercel Blob once an upload lands. The file
 * itself never passes through this route or through a Vercel function at
 * all -- it goes straight from the browser to Blob storage. See
 * https://vercel.com/docs/vercel-blob/client-upload.
 *
 * There's no database table of uploads to keep in sync: the picker lists
 * images straight from the Blob store (listBlogImagesAction), so
 * onUploadCompleted has nothing to persist.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // requireFounder() (used by every other /admin action) redirects on
        // failure, which doesn't make sense for a JSON token endpoint --
        // throwing here surfaces as a clean 400 the picker can show inline.
        const session = await auth();
        if (!session?.user?.id || !isFounder(session.user.email)) {
          throw new Error("Not authorized");
        }
        return {
          allowedContentTypes: [...BLOG_IMAGE_CONTENT_TYPES],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do -- see the file comment above.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
