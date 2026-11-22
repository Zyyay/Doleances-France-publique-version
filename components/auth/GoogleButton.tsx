"use client";

import { useEffect, useRef, useState } from "react";
import { withNext } from "@/lib/auth/nextPath";
import { createClient } from "@/lib/supabase/client";
import styles from "./auth.module.css";

// Public by design (unlike the Client Secret) — safe to ship in client code.
const GOOGLE_CLIENT_ID = "1078501761393-mhq8kkdoi2r0g6jgms49gh9s7grp7a67.apps.googleusercontent.com";
const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    nonce: string;
    callback: (response: GoogleCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: { theme: string; size: string; text: string; locale: string; width: number }
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

// Cached at module scope: several GoogleButton instances (or remounts while
// navigating between /connexion and /inscription) must never inject the
// <script> tag more than once.
let gsiScriptPromise: Promise<void> | null = null;
function loadGsiScript(): Promise<void> {
  if (window.google) return Promise.resolve();
  gsiScriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services script"));
    document.head.appendChild(script);
  });
  return gsiScriptPromise;
}

/**
 * Google's own ID-token nonce dance (see the signInWithIdToken/linkIdentity
 * calls below): Google embeds whatever `nonce` it's given as-is into the
 * signed ID token, so passing the raw value straight through would let
 * anyone who intercepts the token trivially replay it. Supabase's documented
 * pattern is to give Google a SHA-256 hash of the nonce, then hand Supabase
 * the original raw value — it re-hashes and compares against the token's
 * `nonce` claim server-side.
 */
async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Replaces the old signInWithOAuth() full-page redirect through
 * supabase.co/auth/v1/authorize — that flow showed the visitor Supabase's
 * raw project URL before they ever reached Google, the worst possible
 * moment to look like an unfamiliar site on a civic-engagement platform.
 * signInWithIdToken() calls Google directly from this origin (verified via
 * the /test-gsi-poc throwaway: Google's own popup shows "Doléances France",
 * never the Supabase URL) and never leaves the page.
 */
export function GoogleButton({
  text = "continue_with",
  next = null,
}: {
  text?: "signup_with" | "continue_with";
  /** Page to return to after sign-in (already validated by safeNextPath). */
  next?: string | null;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        await loadGsiScript();
      } catch {
        if (!cancelled) setError("Connexion Google indisponible pour le moment.");
        return;
      }
      if (cancelled || !window.google || !buttonRef.current) return;

      const rawNonce = crypto.randomUUID();
      const hashedNonce = await sha256Hex(rawNonce);
      if (cancelled) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        callback: async (response) => {
          setPending(true);
          setError(null);
          const supabase = createClient();

          // Same reasoning as the email-signup upgrade path: a visitor who
          // arrived via a tagged share link already has an anonymous
          // session (see proxy.ts) whose profile row carries the
          // first-touch UTM — linkIdentity() converts that same session in
          // place (same user id, same profile row) instead of
          // signInWithIdToken() creating a brand-new, untagged account.
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          const { data, error: authError } = currentUser?.is_anonymous
            ? await supabase.auth.linkIdentity({ provider: "google", token: response.credential, nonce: rawNonce })
            : await supabase.auth.signInWithIdToken({ provider: "google", token: response.credential, nonce: rawNonce });

          if (authError || !data.user) {
            setError("Connexion Google indisponible pour le moment.");
            setPending(false);
            return;
          }

          if (currentUser?.is_anonymous) {
            // linkIdentity() updates the auth.users row (is_anonymous flips
            // to false there) but doesn't reissue the access token already
            // held by this session — refresh so RLS (which reads the JWT
            // claim, not the live DB row) sees a real account right away.
            await supabase.auth.refreshSession();
          }

          // First-ever sign-in for this user: Google doesn't know our
          // optional demographic fields, so offer the same "compléter mon
          // profil" step the email flow collects at signup. Checked on the
          // Google *identity* itself (created_at === last_sign_in_at), not
          // the user row — a visitor upgrading an anonymous session has a
          // user row that's already old by now, which would wrongly read as
          // "not their first sign-in" even though this is genuinely it.
          const identity = data.user.identities?.[0];
          const isFirstSignIn = identity
            ? identity.created_at === identity.last_sign_in_at
            : data.user.created_at === data.user.last_sign_in_at;

          window.location.href = isFirstSignIn ? withNext("/completer-profil", next) : (next ?? "/");
        },
      });

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text,
        locale: "fr",
        width: 320,
      });
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [text, next]);

  return (
    <div>
      <div ref={buttonRef} aria-busy={pending} />
      {error && <p className={styles.fieldError}>{error}</p>}
    </div>
  );
}
