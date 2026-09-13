/**
 * Shared between the upload route (server) and the image picker (client) so
 * the allow-list and size ceiling can't drift between the two sides of the
 * upload flow.
 */
export const BLOG_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/**
 * Generous ceiling, not a real constraint: uploads go straight from the
 * browser to Vercel Blob storage (see the upload route), not through a
 * Vercel serverless function, so there's no 4.5MB function-body cap to work
 * around here. This just stops someone from uploading something absurd.
 */
export const MAX_BLOG_IMAGE_BYTES = 20 * 1024 * 1024;
