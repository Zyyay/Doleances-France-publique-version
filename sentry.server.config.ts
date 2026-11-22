import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Error tracking only — no performance/tracing, to keep the free tier's
  // shared event quota (5,000/month) spent entirely on real errors.
  tracesSampleRate: 0,
});
