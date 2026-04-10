import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for build due to directory name with spaces
  // Turbopack is used for dev by default in Next.js 16
};

export default nextConfig;
