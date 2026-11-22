import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Reads profiles.email_verified, not auth.users.email_confirmed_at — with
 * Supabase's "Confirm email" off, the latter is filled at signup for every
 * account and no longer means anything (see the add_profile_email_verified
 * migration).
 */
export async function isEmailVerified(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("email_verified").eq("user_id", userId).maybeSingle();
  return data?.email_verified === true;
}
