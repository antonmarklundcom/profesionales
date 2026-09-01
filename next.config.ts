import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger managed Node.js hosting runs the standalone server output.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  eslint: {
    // Linting runs as its own step in `npm run verify` and in CI.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
