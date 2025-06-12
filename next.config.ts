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
        {
          protocol: 'https',
          hostname: 'images.unsplash.com',
          port: '',
          pathname: '/**',
        },
        {
          protocol: 'https',
          hostname: 'nrxllvssrhscdywaenvo.supabase.co',
          port: '',
          pathname: '/storage/v1/object/public/**',
        },
      ],
    },
};

export default nextConfig;
