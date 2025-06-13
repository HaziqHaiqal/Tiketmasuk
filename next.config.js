/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { hostname: "academic-elk-287.convex.cloud", protocol: "https" },
    ],
  },
};

module.exports = nextConfig;
