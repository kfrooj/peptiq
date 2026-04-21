import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 👈 REQUIRED for Capacitor static build

  images: {
    unoptimized: true, // 👈 REQUIRED for static export
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;