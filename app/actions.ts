"use server";

import { hasSensitiveDataConsent } from "@/lib/auth/consent";
import { isRealUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";

const TITLE_MAX = 140;
const MESSAGE_MAX = 600;

/** `a-b-c` from "A, b'c!" — collapses anything outside [a-z0-9] into single hyphens. */
function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return slug || "sujet";
}

/**
 * Records a logged-in user's "Proposer un sujet" submission as a pending,
 * user-sourced `subjects` row (see the subject_proposals migration) — an
 * admin later fleshes it out and flips status to 'active', or leaves it
 * pending/archived to reject it. Nothing is shown publicly: every public
 * query filters status = 'active', and RLS itself only allows public reads
 * of active rows.
 *
 * The client only calls this when it already knows the user is logged in
 * (see ProposeSubjectButton's login popin for the logged-out path), but auth
 * is always re-checked here since that's what's actually enforced (RLS backs
 * it up). `website` is a honeypot field — real users never see or fill it;
 * a non-empty value means a bot filled every input and we reject silently.
 * `needsConsent: true` means nothing was recorded — see castVote's comment
 * (app/sujets/[slug]/actions.ts) for the article-9 consent flow; a proposed
 * subject's message is free text and can just as easily reveal a political
 * opinion as a vote can.
 */
export async function proposeSubject(
  title: string,
  message: string,
  website: string
): Promise<{ ok: boolean; needsConsent?: boolean }> {
  if (website.trim()) return { ok: false };

  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();
  if (!trimmedTitle || !trimmedMessage) return { ok: false };
  if (trimmedTitle.length > TITLE_MAX || trimmedMessage.length > MESSAGE_MAX) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isRealUser(user)) return { ok: false };

  if (!(await hasSensitiveDataConsent(supabase, user.id))) return { ok: false, needsConsent: true };

  const { ok: withinLimit } = await rateLimit.proposeSubject(user.id);
  if (!withinLimit) return { ok: false };

  const slug = `${slugify(trimmedTitle)}-${user.id.slice(0, 8)}`;

  const { error } = await supabase.from("subjects").insert({
    slug,
    title: trimmedTitle,
    proposal_message: trimmedMessage,
    status: "pending",
    source: "user",
    created_by: user.id,
  });
  if (error) throw error;

  return { ok: true };
}
