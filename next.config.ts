import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse", "puppeteer"],
  // A stray lockfile in a parent directory otherwise makes Next.js infer the
  // wrong workspace root. The app and its dependencies live in this directory.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

