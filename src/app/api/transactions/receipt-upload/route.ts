import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RECEIPT_IMAGE_CONTENT_TYPES, MAX_RECEIPT_IMAGE_BYTES } from "@/lib/media";

/**
 * Issues client-upload tokens for the transaction modal's receipt field.
 * The photo goes straight from the browser to Blob storage (never through
 * this route or a Vercel function -- see
 * https://vercel.com/docs/vercel-blob/client-upload), so there's no
 * 4.5MB function-body limit to worry about for a full-size phone photo.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Thrown errors surface as a clean 400 the modal can show inline,
        // same reasoning as the blog upload route's onBeforeGenerateToken.
        const session = await auth();
        if (!session?.user?.id) {
          throw new Error("Not authorized");
        }
        const [business] = await db
          .select({ id: businesses.id })
          .from(businesses)
          .where(eq(businesses.userId, session.user.id))
          .limit(1);
        if (!business) {
          throw new Error("Not authorized");
        }
        if (!pathname.startsWith("receipts/")) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [...RECEIPT_IMAGE_CONTENT_TYPES],
          maximumSizeInBytes: MAX_RECEIPT_IMAGE_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // Nothing to do -- the resulting URL is saved on the transaction
        // row directly by the create/update action, not tracked here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
