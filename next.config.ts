import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Marketing screenshots are cache-busted with a "?v=" query string
    // (see SCREENSHOT_VERSION in landing-page.tsx) so a regenerated image
    // under the same filename isn't served stale from a visitor's cache.
    localPatterns: [{ pathname: "/marketing/**" }],
  },
};

export default nextConfig;
