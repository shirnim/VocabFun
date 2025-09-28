import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopack: {
      root: __dirname,
    },
  },
};

export default nextConfig;
