import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.peoplesfirstmovement.com";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
};

export default nextConfig;
