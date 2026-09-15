import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Admins enter arbitrary HTTPS image URLs; local uploads live under /public/uploads.
    // Tighten this to your CDN host(s) before production if you want to restrict optimisation.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
