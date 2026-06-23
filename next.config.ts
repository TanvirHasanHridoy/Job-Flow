import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@napi-rs/canvas", "pdf-parse", "puppeteer", "puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;

