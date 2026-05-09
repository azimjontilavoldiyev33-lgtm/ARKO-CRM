import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,


  images: {
    domains: ['res.cloudinary.com'],
  },
  async headers() {
    return [
      {
        source: '/api/webhook',
        headers: [
          {
            key: 'ngrok-skip-browser-warning',
            value: 'true',
          },
        ],
      },
    ];
  },
};



export default nextConfig;
