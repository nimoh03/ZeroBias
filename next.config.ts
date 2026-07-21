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
  // pdfjs-dist loads its worker file dynamically at runtime (not via a
  // static import), so Vercel's file tracer can't discover it on its own
  // and leaves it out of the deployed function — hence "Cannot find
  // module .../pdf.worker.mjs" even though the package itself is present.
  // This forces it to be included regardless of trace detection.
  outputFileTracingIncludes: {
    "/api/upload-cv/route": ["./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"],
  },
};

export default nextConfig;