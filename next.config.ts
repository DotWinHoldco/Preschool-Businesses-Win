import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/book-online',
        destination: '/contact',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
