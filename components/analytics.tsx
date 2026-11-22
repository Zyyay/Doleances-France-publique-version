"use client";

import { Analytics as VercelAnalytics, type BeforeSendEvent } from "@vercel/analytics/next";

// Paths that carry a Supabase auth handshake in the URL itself — never sent
// to analytics even with the query string stripped, since the path alone
// already identifies the request as part of an auth flow.
const AUTH_PATH_PREFIXES = ["/auth/callback", "/auth/confirm"];

// Query params Supabase puts a live token/code in — presence alone (on any
// path) means the URL isn't safe to forward, auth path or not.
const AUTH_TOKEN_PARAMS = ["access_token", "refresh_token", "code", "token_hash"];

// Internal admin routes — never tracked, regardless of query string.
const ADMIN_PATH_PREFIX = "/admin";

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  let url: URL;
  try {
    // event.url isn't guaranteed to be absolute — a bare `new URL(event.url)`
    // throws on a relative one, and an uncaught throw here can silently kill
    // the whole send, not just this event. window.location.origin as a base
    // makes both shapes parse.
    url = new URL(event.url, window.location.origin);
  } catch {
    // Unparseable — can't verify it's safe to forward, so drop it rather
    // than risk sending an unredacted URL.
    return null;
  }

  if (AUTH_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) return null;
  if (AUTH_TOKEN_PARAMS.some((param) => url.searchParams.has(param))) return null;
  if (url.pathname.startsWith(ADMIN_PATH_PREFIX)) return null;

  // Everything else: strip query params — the collector's `o` field is
  // validated as an absolute URL (`^https?://`), so a bare pathname gets
  // rejected outright; keep the origin, drop only the search string.
  return { ...event, url: url.origin + url.pathname };
}

export function Analytics() {
  return <VercelAnalytics beforeSend={beforeSend} />;
}
