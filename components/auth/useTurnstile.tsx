"use client";

import { useCallback, useRef, useState } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile for the email/password auth forms (signUp,
 * signInWithPassword — see app/(auth)/actions.ts's readCaptchaToken).
 * Absent NEXT_PUBLIC_TURNSTILE_SITE_KEY (e.g. local dev), `widget` is null
 * and `token`/`required` stay falsy forever — forms keep working uncaptcha'd.
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | undefined>(undefined);
  const ref = useRef<TurnstileInstance | undefined>(undefined);

  const reset = useCallback(() => {
    ref.current?.reset();
    setToken(undefined);
  }, []);

  const widget = SITE_KEY ? (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY}
      options={{ language: "fr" }}
      onSuccess={setToken}
      onExpire={() => setToken(undefined)}
    />
  ) : null;

  return { token, widget, reset, required: Boolean(SITE_KEY) };
}
