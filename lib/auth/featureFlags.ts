// Google OAuth credentials are configured in Google Cloud Console and the
// Supabase dashboard (Authentication > Providers > Google). Flip back to
// false to hide the buttons again without touching that configuration.
export const GOOGLE_AUTH_ENABLED = true;

// Off since 2026-10-24: new accounts can vote without confirming their
// e-mail. Turning it back on requires BOTH this flag and Supabase's
// Authentication > Sign In / Providers > "Confirm email" toggle — the flag
// gates voting on profiles.email_verified, the Supabase toggle is what
// actually sends the confirmation e-mail at signup.
export const EMAIL_VERIFICATION_REQUIRED = false;
