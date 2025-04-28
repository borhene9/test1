import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  serverRuntimeConfig: {
    // Will only be available on the server side
    PORT: process.env.PORT || 3000,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    PORT: process.env.PORT || 3000,
  },
};

export default nextConfig;
