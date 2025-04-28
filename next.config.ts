import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    PORT: process.env.PORT || '3000',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
};

export default nextConfig;
