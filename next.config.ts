import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A separate build directory lets `next build` / `next start` run alongside `next dev`, which
  // owns `.next` (used for audit and smoke runs: NEXT_DIST_DIR=.next-audit).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    // Admins enter arbitrary HTTPS image URLs; local uploads live under /public/uploads.
    // Tighten this to your CDN host(s) before production if you want to restrict optimisation.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
