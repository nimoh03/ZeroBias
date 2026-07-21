import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // @napi-rs/canvas ships a native .node binary. Left to webpack's default
  // bundling, it tries to parse that binary as JS source and fails to
  // compile. serverExternalPackages tells Next.js to require() it at
  // runtime instead of bundling it — the right handling for any package
  // with native addons in a server-only route.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
};

export default nextConfig;