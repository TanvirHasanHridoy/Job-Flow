import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse"],
};

export default nextConfig;

