import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { hostname: "academic-elk-287.convex.cloud", protocol: "https" },
    ],
  },
};

export default nextConfig;
