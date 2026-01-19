// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost", // 👈 이게 있어야 "localhost" 주소 이미지가 보임
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1", // 👈 이건 아까 api 호출용으로 추가한 것
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // Cloudinary 주소 허용
      },
    ],
  },
};

export default nextConfig;
