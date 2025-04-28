import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    PORT: process.env.PORT || '3000',
  },
  experimental: {
    serverExternalPackages: [],
  },
};

export default nextConfig;
