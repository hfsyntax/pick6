import type { NextConfig } from "next"
const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "files.edgestore.dev",
        pathname: "**",
      },
    ],
  },
  experimental: {
    useCache: true,
  },
}

export default nextConfig
