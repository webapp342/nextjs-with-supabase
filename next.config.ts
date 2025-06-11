import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'storage.khanoumi.com',
          port: '',
          pathname: '/ProductImages/**',
        },
      ],
    },
};

export default nextConfig;
