// Same resolution order as metadataBase in src/app/[lang]/layout.tsx:
// explicit override, then Vercel's production URL, then the real domain.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://bookkeeply.me")
).replace(/\/$/, "");
