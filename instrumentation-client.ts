import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Error tracking only — no performance tracing, no session replay: keeps
  // the free tier's shared event quota spent entirely on real errors.
  tracesSampleRate: 0,
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
