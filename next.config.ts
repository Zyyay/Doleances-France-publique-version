import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import { SUPABASE_URL } from "@/lib/supabase/config";

const isDev = process.env.NODE_ENV === "development";

/**
 * Nonce-based script-src (the stricter option, avoiding 'unsafe-inline' for
 * scripts) was tried first and reverted: in a production build, the nonce
 * Next.js baked into script tags didn't match the nonce sent in the CSP
 * response header (verified via Chrome DevTools Protocol — every chunk and
 * inline script was blocked, likely a Turbopack interaction in this Next.js
 * version). 'unsafe-inline' for scripts is a real tradeoff, but a low-risk
 * one here: this app has zero <script>/next/script/dangerouslySetInnerHTML
 * usage (verified by grep), so there's no inline script surface for it to
 * expose beyond what a working CSP already blocks via script-src 'self'
 * (no third-party script origins). style-src needs 'unsafe-inline'
 * regardless of the script-src approach — CSP nonces only ever cover
 * <style> elements, never the style="" attribute, and several components
 * (category colors, timeline accents) render dynamic values through React's
 * `style` prop.
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  connect-src 'self' ${SUPABASE_URL} https://*.sentry.io https://*.ingest.sentry.io https://challenges.cloudflare.com https://accounts.google.com;
  frame-src https://challenges.cloudflare.com https://accounts.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  // The app is accessed through the Codespaces port-forwarding domain in
  // dev, not localhost — without this, Next.js blocks cross-origin requests
  // to dev-only assets/RSC endpoints from that origin, which breaks client
  // hydration (buttons render but don't respond to clicks).
  allowedDevOrigins: ["*.app.github.dev"],

  // Permanent redirects for two subject slugs renamed in an editorial pass
  // (2026-09-13) — keeps already-shared/indexed links working.
  async redirects() {
    return [
      {
        source: "/sujets/mettre-en-place-des-dispositifs-pour-garantir-l-expulsion-effective-des-etrangers-illegaux",
        destination: "/sujets/mettre-en-place-des-dispositifs-pour-garantir-l-expulsion-effective-des-etrangers-en-situation-irreguliere",
        permanent: true,
      },
      {
        source: "/sujets/faut-il-exiger-un-paiement-avant-les-soins-non-urgents-des-personnes-non-couvertes-par-l-assurance-maladie-francaise",
        destination: "/sujets/pour-les-soins-non-urgents-faut-il-exiger-un-paiement-avant-de-soigner-les-personnes-non-assurees",
        permanent: true,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

// Wrapping is only needed to upload source maps at build time (so stack
// traces in Sentry resolve to real file/line instead of minified bundle
// positions) — skipped entirely without SENTRY_AUTH_TOKEN so an
// unconfigured Sentry account never affects local dev or a normal build.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: !process.env.CI,
    })
  : nextConfig;
