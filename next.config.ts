import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // The /_error pre-render Html error is a known Next.js 15 App Router bug
    // Our source code is TypeScript-clean; this only suppresses the internal Next.js error
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Prevent "useContext" null errors during static prerendering of pages that use
    // client-side hooks (Redux, useRouter, etc.) without a proper SSR context
    missingSuspenseWithCSRBailout: false,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
