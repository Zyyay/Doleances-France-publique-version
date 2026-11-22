"use server";

import { hasSensitiveDataConsent } from "@/lib/auth/consent";
import { isEmailVerified } from "@/lib/auth/emailVerification";
import { EMAIL_VERIFICATION_REQUIRED } from "@/lib/auth/featureFlags";
import { isRealUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

/**
 * Same upsert as sujets/[slug]/actions.ts's castVote, minus the redirect —
 * the Vote Express deck advances client-side between cards instead of
 * navigating to a new page after every vote. `needsConsent: true` and
 * `needsEmailConfirmation: true` both mean the vote was NOT recorded — see
 * castVote's comment.
 */
export async function castQuickVote(
  subjectId: string,
  resultId: string
): Promise<{ ok: boolean; needsConsent?: boolean; needsEmailConfirmation?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isRealUser(user)) return { ok: false };
  if (EMAIL_VERIFICATION_REQUIRED && !(await isEmailVerified(supabase, user.id))) {
    return { ok: false, needsEmailConfirmation: true };
  }

  if (!(await hasSensitiveDataConsent(supabase, user.id))) return { ok: false, needsConsent: true };

  const { ok: withinLimit } = await rateLimit.vote(user.id);
  if (!withinLimit) return { ok: false };

  const { error } = await supabase
    .from("votes")
    .upsert({ user_id: user.id, subject_id: subjectId, result_id: resultId }, { onConflict: "user_id,subject_id" });
  if (error) throw error;

  return { ok: true };
}
