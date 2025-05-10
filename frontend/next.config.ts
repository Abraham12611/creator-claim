import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
<<<<<<< HEAD
=======
  reactStrictMode: true,
  // Add transpilePackages to handle potential package compatibility issues
  transpilePackages: ['@tailwindcss/postcss'],
  // Configure allowed image domains
  images: {
    domains: ['arweave.net', 'gateway.irys.xyz', 'devnet.irys.xyz', 'via.placeholder.com'],
  },
>>>>>>> cbd537c (Auto-commit frontend/next.config.ts)
};

export default nextConfig;
