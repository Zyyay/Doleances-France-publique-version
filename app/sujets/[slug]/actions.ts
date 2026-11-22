"use server";

import { redirect } from "next/navigation";
import { hasSensitiveDataConsent } from "@/lib/auth/consent";
import { isEmailVerified } from "@/lib/auth/emailVerification";
import { EMAIL_VERIFICATION_REQUIRED } from "@/lib/auth/featureFlags";
import { isRealUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

/**
 * Casts (or overwrites) the current user's vote for a subject. One row per
 * (user, subject) — upserting on that key is how a re-vote replaces the
 * previous choice in place, no history/status kept (see votes migration).
 * Stays on the subject page — the caller (VoteCard) updates its own UI and
 * shows the thank-you toast itself instead of following a redirect.
 *
 * The client only calls this when it already knows the user is logged in
 * (see VoteCard's login popin for the logged-out path), but auth is always
 * re-checked here since that's what's actually enforced (RLS backs it up).
 * `needsConsent: true` means the vote was NOT recorded — the caller must
 * show the article-9 consent popin and retry after giveSensitiveDataConsent()
 * succeeds (see app/(auth)/actions.ts). `needsEmailConfirmation: true` means
 * the same: not recorded, caller shows the "confirme ton e-mail" popin. It
 * only fires while EMAIL_VERIFICATION_REQUIRED is on (off since 2026-10-24,
 * see lib/auth/featureFlags.ts).
 *
 * Also returns the subject's fresh result counts post-upsert — the caller
 * (VoteCard) uses these, not the page's already-stale SSR `results` prop, to
 * show the vote's real share. Computing that client-side from the stale
 * prop drifted from the real total: it can't account for other votes that
 * landed since page load, or for this same click overwriting an earlier
 * vote in the same session (a re-vote changes which bucket a count sits in,
 * not the total, which a naive "+1 to the total" client estimate gets wrong).
 */
export async function castVote(
  subjectId: string,
  resultId: string
): Promise<{
  ok: boolean;
  needsConsent?: boolean;
  needsEmailConfirmation?: boolean;
  results?: { id: string; vote_count: number }[];
}> {
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

  const { data: results, error: resultsError } = await supabase
    .from("results")
    .select("id, vote_count")
    .eq("subject_id", subjectId);
  if (resultsError) throw resultsError;

  return { ok: true, results: results ?? undefined };
}

/**
 * Records free-text feedback a logged-in user leaves on a subject page. The
 * client only calls this once it already knows the user is logged in (see
 * FeedbackButton's login popin for the logged-out path), but auth is always
 * re-checked here since that's what's actually enforced (RLS backs it up).
 * `needsConsent: true` means nothing was recorded — see castVote's comment.
 */
export async function submitPageFeedback(subjectId: string, content: string): Promise<{ ok: boolean; needsConsent?: boolean }> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 2000) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isRealUser(user)) {
    redirect("/connexion");
  }

  if (!(await hasSensitiveDataConsent(supabase, user.id))) return { ok: false, needsConsent: true };

  const { ok: withinLimit } = await rateLimit.feedback(user.id);
  if (!withinLimit) return { ok: false };

  const { error } = await supabase
    .from("page_feedback")
    .insert({ user_id: user.id, subject_id: subjectId, content: trimmed });
  if (error) throw error;

  return { ok: true };
}
