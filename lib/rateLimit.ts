import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Requires UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN (free tier at
 * upstash.com — create a Redis database, copy the REST credentials into
 * .env.local and the Vercel project's env vars). Without them, limiting is
 * skipped rather than failing closed — local dev shouldn't require an
 * Upstash account just to run `npm run dev`, but production must set these
 * or every action below is unlimited again.
 */
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;

if (!redis && process.env.NODE_ENV === "production") {
  console.warn(
    "[rateLimit] UPSTASH_REDIS_REST_URL/TOKEN are not set — Server Actions are running without rate limiting."
  );
}

function makeLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`, prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `ratelimit:${prefix}`,
    analytics: true,
  });
}

// Vote: generous enough to cover a real person swiping fast through the
// Vote Express deck, tight enough to stop a script hammering
// castVote/castQuickVote.
const voteLimiter = makeLimiter(20, "10 s", "vote");
// Signup: account creation is the expensive one to abuse (each one can then
// vote once, unlocked by the CAPTCHA work separately) — tight, per IP.
const signUpLimiter = makeLimiter(5, "1 h", "signup");
// Login: generous for typos, tight enough to blunt a brute-force script.
const signInLimiter = makeLimiter(10, "5 m", "signin");
// Free-text feedback: cheap to spam, no reason to allow bursts.
const feedbackLimiter = makeLimiter(5, "1 m", "feedback");
// Profile edits: low-risk, just a sanity cap.
const profileLimiter = makeLimiter(10, "1 m", "profile");
// Subject proposals: heavier than feedback (creates a row an admin has to
// triage), so a tight per-user cap rather than a per-minute burst window.
const proposeSubjectLimiter = makeLimiter(3, "1 h", "proposeSubject");
// Consent: cheap idempotent upsert, but every other write action has a cap —
// generous enough to never bother a real retry.
const consentLimiter = makeLimiter(10, "1 m", "consent");
// OAuth callback: unauthenticated at this point (pre-session), so per-IP
// only — real users hit this once or twice a session at most.
const oauthCallbackLimiter = makeLimiter(10, "1 m", "oauthCallback");
// Resend confirmation: a real user only needs this a couple of times
// (missed/expired email) — tight per-user cap against re-triggering sends.
const resendConfirmationLimiter = makeLimiter(3, "1 h", "resendConfirmation");

/**
 * Client IP from the `x-forwarded-for` header Vercel sets on every request
 * (first entry is the original client). Falls back to a constant so a
 * single misbehaving client without the header shares one bucket instead of
 * bypassing the limit entirely — acceptable since this only matters in
 * environments (e.g. some local setups) that don't set the header anyway.
 */
async function clientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}

/**
 * Returns `{ ok: true }` if the request may proceed, `{ ok: false }` if it
 * should be rejected. `identifier` lets callers combine the IP with e.g. a
 * user ID so an action is limited per-user as well as per-IP.
 */
async function check(limiter: Ratelimit | null, identifier?: string): Promise<{ ok: boolean }> {
  if (!limiter) return { ok: true };
  const key = identifier ? `${await clientIp()}:${identifier}` : await clientIp();
  const { success } = await limiter.limit(key);
  return { ok: success };
}

export const rateLimit = {
  vote: (userId: string) => check(voteLimiter, userId),
  signUp: () => check(signUpLimiter),
  signIn: () => check(signInLimiter),
  feedback: (userId: string) => check(feedbackLimiter, userId),
  profile: (userId: string) => check(profileLimiter, userId),
  proposeSubject: (userId: string) => check(proposeSubjectLimiter, userId),
  consent: (userId: string) => check(consentLimiter, userId),
  oauthCallback: () => check(oauthCallbackLimiter),
  resendConfirmation: (userId: string) => check(resendConfirmationLimiter, userId),
};
