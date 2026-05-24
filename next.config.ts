import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.3", "localhost", "192.168.1.3:3000", "192.168.1.3:3001"],
};

export default nextConfig;
