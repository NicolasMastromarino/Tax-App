import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { W9_DOCUMENT_CONTENT_TYPES, MAX_W9_DOCUMENT_BYTES } from "@/lib/media";

/**
 * Issues client-upload tokens for the Contractors page's W-9 field. Same
 * shape as the receipt-upload route -- see that file's comment for why the
 * upload never passes through this route or a Vercel function.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
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
        if (!pathname.startsWith("w9s/")) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [...W9_DOCUMENT_CONTENT_TYPES],
          maximumSizeInBytes: MAX_W9_DOCUMENT_BYTES,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
