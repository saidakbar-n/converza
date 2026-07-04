import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const api = process.env.CONVERZA_API_URL || "http://127.0.0.1:8001";
    return [
      {
        source: "/api/pipeline/:path*",
        destination: `${api}/api/pipeline/:path*`,
      },
      {
        source: "/api/pipeline",
        destination: `${api}/api/pipeline`,
      },
      {
        source: "/api/brand-passport/:path*",
        destination: `${api}/api/brand-passport/:path*`,
      },
      {
        source: "/api/orchestrate",
        destination: `${api}/api/orchestrate`,
      },
      {
        source: "/api/auth/:path*",
        destination: `${api}/api/auth/:path*`,
      },
      {
        source: "/health",
        destination: `${api}/health`,
      },
    ];
  },
};

export default nextConfig;
