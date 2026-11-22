import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
import { parseUtm } from "@/lib/utm";

// Named `proxy` (not `middleware`) — Next.js 16 renamed Middleware to Proxy,
// same file-level convention and behavior. Keeps the Supabase auth session
// cookie fresh on every request so Server Components see an up-to-date user.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // The session cookie is stale — its user was deleted, or the token is
  // otherwise no longer valid server-side. Left alone, every subsequent
  // request/prefetch (this proxy runs on nearly all of them) keeps resending
  // that dead JWT and eating a wasted GET /user 403 from Supabase Auth, with
  // nothing on the client ever clearing it. Sign out locally right here —
  // cookie-only, no extra API call — so the stale session stops propagating
  // at the source instead of compounding across every future request.
  if (error) {
    await supabase.auth.signOut({ scope: "local" });
  }

  // First-touch UTM attribution (see supabase/migrations/..._add_utm_attribution.sql):
  // only when a visitor with no session at all lands on a validly-tagged
  // share link do we open an anonymous Supabase session — this is the
  // existing session mechanism (same cookie), not a new one, and it's
  // deliberately NOT done for every anonymous page view (that would create
  // an auth.users row per random visitor) — only when there's real UTM to
  // attach to it. Once a session (anonymous or real) exists, its profile's
  // utm_* is locked in place forever by the DB trigger; no backfill here.
  if (!user) {
    const utm = parseUtm(request.nextUrl.searchParams);
    if (utm) {
      const { error } = await supabase.auth.signInAnonymously({ options: { data: utm } });
      if (error) {
        console.error("[proxy] signInAnonymously failed:", error.message, utm);
      }
    }
  }

  return response;
}

// robots.txt, sitemap.xml and opengraph-image routes are what crawlers and
// link-preview bots (X, etc.) fetch most, and none of them depend on the
// visitor's session — skipping the proxy spares a Supabase session check
// and a function invocation on every one of those requests. UTM attribution
// is unaffected: tagged links point at pages, never at these files.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
