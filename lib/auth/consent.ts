import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Article 9 GDPR consent check — see the sensitive_data_consent_at
 * migration. Called before any write that ties a vote/comment/proposal to
 * an identified account, since several subjects on this platform can
 * reveal a political opinion once attributed to a person.
 */
export async function hasSensitiveDataConsent(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase.from("profiles").select("sensitive_data_consent_at").eq("user_id", userId).maybeSingle();
  return data?.sensitive_data_consent_at != null;
}
