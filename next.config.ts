import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://backend-farmacia-production.up.railway.app'}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;