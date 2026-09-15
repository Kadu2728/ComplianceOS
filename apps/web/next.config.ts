import type { NextConfig } from "next";

/**
 * Static security headers (CLAUDE.md §9). The Content Security Policy is per request — it carries
 * a script nonce — and lives in `src/middleware.ts`; `/api/v1` responses are JSON proxied from the
 * API, which sends its own headers.
 */
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
