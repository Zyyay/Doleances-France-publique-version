import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * A Supabase session can now be anonymous (see the UTM-attribution anonymous
 * sign-in in proxy.ts, used to survive a visitor's browsing between clicking
 * a shared link and creating a real account or voting) — an anonymous
 * session must never satisfy a "logged in" check meant for real accounts.
 * Use this everywhere a bare `!!user`/`!user` check used to mean "logged in".
 */
export function isRealUser(user: User | null): user is User {
  return user !== null && !user.is_anonymous;
}

/**
 * supabase.auth.getUser() hits Supabase's Auth server over the network (it
 * verifies the JWT server-side, unlike getSession()) — cache() collapses
 * every Server Component in the same request that needs the current user
 * (SiteNav plus whatever page it's rendered on) down to a single call
 * instead of one each. Only helps within one request/render pass: a Server
 * Action invoked from a form is its own separate request, so this buys it
 * nothing there — those still call supabase.auth.getUser() directly.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
