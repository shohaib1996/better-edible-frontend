import type { NextConfig } from "next";

const isStaging = process.env.NEXT_PUBLIC_ENV === "staging";

const nextConfig: NextConfig = {
  basePath: isStaging ? "/staging" : "",
  assetPrefix: isStaging ? "/staging" : "",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
