import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// dotenv's default config() only loads `.env`, not `.env.local` — load both,
// with `.env.local` taking precedence (matches Next.js env file conventions).
config({ path: ".env" });
config({ path: ".env.local", override: true });

const SUPABASE_URL = "https://nwrrtcjzzfqbbdlcnpqx.supabase.co";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is not set. The content pipeline writes rows with review_status = " +
      "'pending_review', which requires bypassing the public-read-only RLS policies — the anon key " +
      "used by the app (lib/supabase.ts) cannot do this. Get the service_role key from " +
      "Supabase Dashboard → Project Settings → API, and set it in your environment " +
      "(e.g. a .env.local file, NEVER committed to git, NEVER used in app/ or components/)."
  );
}

// Service-role client: bypasses RLS. Only ever import this from scripts/ —
// never from app/ or components/, or the key would ship to the browser.
export const supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
