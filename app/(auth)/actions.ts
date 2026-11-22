"use server";

import { redirect } from "next/navigation";
import { EMAIL_VERIFICATION_REQUIRED } from "@/lib/auth/featureFlags";
import { safeNextPath } from "@/lib/auth/nextPath";
import { isRealUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rateLimit";
import { createClient } from "@/lib/supabase/server";
import { isDisposableEmail, isValidEmailFormat } from "@/lib/auth/email";
import { checkPasswordStrength } from "@/lib/auth/password";
import { EDUCATION_LEVEL_VALUES, FRENCH_DEPARTMENT_CODES, GENDER_VALUES, WORLD_ZONE_CODES } from "@/lib/auth/profileOptions";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  message?: string;
}

function readCaptchaToken(formData: FormData): string | undefined {
  const token = String(formData.get("turnstileToken") ?? "").trim();
  return token || undefined;
}

/**
 * GoTrue's documented code is 'captcha_failed', but that's unverified against
 * this project's exact GoTrue version — falls back to a message match so a
 * captcha rejection never gets shown as a generic auth error.
 */
function isCaptchaError(error: { code?: string; message: string }): boolean {
  return error.code === "captcha_failed" || /captcha/i.test(error.message);
}

function readOptionalProfileFields(formData: FormData) {
  const birthYearRaw = String(formData.get("birth_year") ?? "").trim();
  const isExpat = formData.get("is_expat") === "on";
  const department = String(formData.get("department") ?? "").trim();
  const educationLevel = String(formData.get("education_level") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();

  const fieldErrors: Record<string, string> = {};

  let birthYear: number | null = null;
  if (birthYearRaw) {
    const year = Number(birthYearRaw);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      fieldErrors.birth_year = `Doit être une année entre 1900 et ${currentYear}.`;
    } else {
      birthYear = year;
    }
  }

  if (department) {
    const validCodes = isExpat ? WORLD_ZONE_CODES : FRENCH_DEPARTMENT_CODES;
    if (!validCodes.has(department)) {
      fieldErrors.department = isExpat ? "Zone invalide." : "Département invalide.";
    }
  }
  if (educationLevel && !EDUCATION_LEVEL_VALUES.has(educationLevel as never)) {
    fieldErrors.education_level = "Niveau d'étude invalide.";
  }
  if (gender && !GENDER_VALUES.has(gender as never)) {
    fieldErrors.gender = "Valeur invalide.";
  }

  return {
    fieldErrors,
    values: {
      birth_year: birthYear,
      is_expat: isExpat,
      department,
      education_level: educationLevel,
      gender,
    },
  };
}

export async function signUpWithEmail(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { ok: withinLimit } = await rateLimit.signUp();
  if (!withinLimit) {
    return { error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const captchaToken = readCaptchaToken(formData);

  if (!isValidEmailFormat(email)) {
    return { error: "Adresse e-mail invalide." };
  }
  if (isDisposableEmail(email)) {
    return { error: "Ce fournisseur d'adresses e-mail jetables n'est pas accepté. Utilise une adresse e-mail durable." };
  }
  if (password !== passwordConfirm) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }
  const passwordCheck = checkPasswordStrength(password);
  if (!passwordCheck.valid) {
    return { error: `Le mot de passe doit contenir : ${passwordCheck.issues.join(", ")}.` };
  }

  const { fieldErrors, values } = readOptionalProfileFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Corrige les champs invalides." };
  }

  const supabase = await createClient();

  // A visitor who arrived via a tagged share link already has an anonymous
  // session (see proxy.ts) whose profile row carries the first-touch UTM —
  // upgrade that session in place (same user id, same profile row) instead
  // of creating a brand-new account, or the UTM attribution is lost.
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (currentUser?.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({ email, password });

    if (error) {
      if (/already registered|already exists|already been registered/i.test(error.message)) {
        return { error: "Un compte existe déjà avec cette adresse e-mail. Essaie de te connecter plutôt." };
      }
      return { error: error.message };
    }

    // updateUser() updates the auth.users row (is_anonymous flips to false
    // there) but does NOT reissue the access token — the JWT already handed
    // to this session still carries its original `is_anonymous: true` claim
    // until a new one is minted. RLS policies read that claim, not the live
    // DB row (see the votes/page_feedback/subjects insert policies added in
    // the UTM migration), so without this refresh every write gated on
    // "must be a real account" would fail with a 42501 despite the account
    // genuinely being real by now.
    await supabase.auth.refreshSession();

    // updateUser() converts the existing anonymous user in place — it
    // doesn't insert a new auth.users row, so handle_new_user() never fires
    // again. Apply the demographic fields straight to the profile row that
    // already exists (created at the anonymous sign-in) instead.
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        birth_year: values.birth_year,
        is_expat: values.is_expat,
        department: values.department || null,
        education_level: values.education_level || null,
        gender: values.gender || null,
      })
      .eq("user_id", currentUser.id);
    if (profileError) throw profileError;

    // updateUser() keeps this session alive, so with verification off the
    // user is already fully signed in — no need to wait on Supabase's
    // auto-confirm (whether it applies to an anonymous upgrade is untested).
    if (!EMAIL_VERIFICATION_REQUIRED || data.user?.email_confirmed_at) {
      redirect(safeNextPath(formData.get("next")) ?? "/");
    }
    return { message: "Compte créé — vérifie ta boîte mail pour confirmer ton inscription." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        birth_year: values.birth_year ?? "",
        is_expat: values.is_expat,
        department: values.department,
        education_level: values.education_level,
        gender: values.gender,
      },
      captchaToken,
    },
  });

  if (error) {
    if (isCaptchaError(error)) {
      return { error: "Vérification anti-robot échouée. Réessaie." };
    }
    if (error.code === "user_already_exists" || /already registered|already exists/i.test(error.message)) {
      return { error: "Un compte existe déjà avec cette adresse e-mail. Essaie de te connecter plutôt." };
    }
    return { error: error.message };
  }

  // When email confirmation is required, Supabase doesn't return an error
  // for an already-registered address (to avoid leaking which emails have
  // accounts) — it silently returns a user with no new identity instead.
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return { error: "Un compte existe déjà avec cette adresse e-mail. Essaie de te connecter plutôt." };
  }

  if (data.session) {
    redirect(safeNextPath(formData.get("next")) ?? "/");
  }

  return { message: "Compte créé — vérifie ta boîte mail pour confirmer ton inscription." };
}

export async function signInWithEmail(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const { ok: withinLimit } = await rateLimit.signIn();
  if (!withinLimit) {
    return { error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const captchaToken = readCaptchaToken(formData);

  if (!isValidEmailFormat(email)) {
    return { error: "Adresse e-mail invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });

  if (error) {
    if (isCaptchaError(error)) {
      return { error: "Vérification anti-robot échouée. Réessaie." };
    }
    return { error: "E-mail ou mot de passe incorrect." };
  }

  redirect(safeNextPath(formData.get("next")) ?? "/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!isRealUser(user)) {
    return { error: "Tu dois être connecté." };
  }

  const { ok: withinLimit } = await rateLimit.profile(user.id);
  if (!withinLimit) {
    return { error: "Trop de tentatives. Réessaie dans quelques minutes." };
  }

  const { fieldErrors, values } = readOptionalProfileFields(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Corrige les champs invalides." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      birth_year: values.birth_year,
      is_expat: values.is_expat,
      department: values.department || null,
      education_level: values.education_level || null,
      gender: values.gender || null,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  // The first-time "compléter mon profil" step (reached only from Google
  // sign-up, see components/auth/GoogleButton.tsx) sets this to send new
  // users somewhere more engaging; /compte's form doesn't, so it stays put
  // and shows a "saved" confirmation instead.
  const redirectTo = safeNextPath(String(formData.get("redirect_to") ?? "").trim());
  if (redirectTo) redirect(redirectTo);
  return { message: "Profil enregistré" };
}

/**
 * Re-sends the signup confirmation e-mail to the current session's own
 * address — used by the "confirme ton e-mail pour voter" popin (see
 * castVote/castQuickVote's needsEmailConfirmation) for a user stuck with a
 * missed or expired link. Real accounts only: an anonymous session has no
 * confirmable e-mail, and this must never leak whether an arbitrary address
 * has an account, so it only ever acts on the caller's own session.
 */
export async function resendConfirmationEmail(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isRealUser(user) || !user.email || user.email_confirmed_at) return { ok: false };

  const { ok: withinLimit } = await rateLimit.resendConfirmation(user.id);
  if (!withinLimit) return { ok: false };

  const { error } = await supabase.auth.resend({ type: "signup", email: user.email });
  if (error) return { ok: false };

  return { ok: true };
}

/**
 * Records explicit article-9 GDPR consent (see the sensitive_data_consent_at
 * migration) — called from the consent popin shown the first time a real
 * account tries to vote, leave feedback, or propose a subject. Idempotent:
 * safe to call again (e.g. a retry), never overwrites an earlier timestamp.
 */
export async function giveSensitiveDataConsent(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isRealUser(user)) return { ok: false };

  const { ok: withinLimit } = await rateLimit.consent(user.id);
  if (!withinLimit) return { ok: false };

  const { data: existing } = await supabase
    .from("profiles")
    .select("sensitive_data_consent_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.sensitive_data_consent_at) return { ok: true };

  // upsert, not update: a handful of accounts predate handle_new_user()'s
  // profiles row creation and have none — a plain update() would silently
  // affect 0 rows (no error) and the consent would never actually be
  // recorded, looping the popin forever on retry.
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, sensitive_data_consent_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return { ok: false };

  return { ok: true };
}
