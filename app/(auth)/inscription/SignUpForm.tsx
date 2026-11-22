"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { PasswordField } from "@/components/auth/PasswordField";
import { ProfileFieldsFieldset } from "@/components/auth/ProfileFieldsFieldset";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { withNext } from "@/lib/auth/nextPath";
import { useTurnstile } from "@/components/auth/useTurnstile";
import { signUpWithEmail, type AuthFormState } from "../actions";
import styles from "@/components/auth/auth.module.css";

const initialState: AuthFormState = {};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function SignUpForm({ googleEnabled, next }: { googleEnabled: boolean; next: string | null }) {
  const [state, action, pending] = useActionState(signUpWithEmail, initialState);
  const [email, setEmail] = useState("");
  const { token, widget, reset, required: captchaRequired } = useTurnstile();

  // Confirmation required: signUpWithEmail() returns a message instead of
  // redirecting (see app/(auth)/actions.ts) whenever Supabase didn't hand
  // back a live session — this swaps the whole card for a clear "go check
  // your inbox" state instead of leaving the just-submitted form sitting
  // there under a one-line note easy to miss.
  if (state.message) {
    return (
      <div className={styles.confirmPanel}>
        <span className={styles.confirmIcon} aria-hidden="true">
          <CheckIcon />
        </span>
        <h1 className={styles.title}>Vérifiez votre boîte mail</h1>
        <p className={styles.confirmText}>
          Un e-mail de confirmation vient d&apos;être envoyé {email && <>à <strong>{email}</strong></>}. Cliquez sur le
          lien qu&apos;il contient pour activer votre compte.
        </p>
        <p className={styles.confirmHint}>Pas reçu ? Pensez à vérifier vos courriers indésirables.</p>
        <Link href="/" className={styles.confirmHomeLink}>
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Créer un compte</h1>
      <p className={styles.subtitle}>Optionnel pour consulter les sujets, nécessaire pour voter.</p>

      {googleEnabled && (
        <>
          <GoogleButton text="signup_with" next={next} />
          <div className={styles.divider}>ou</div>
        </>
      )}

      <form
        className={styles.form}
        onSubmit={(e) => {
          // Not passing the action via the <form action> attribute: React
          // resets uncontrolled fields automatically once that action
          // completes, which was wiping the email field on error.
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          formData.set("turnstileToken", token ?? "");
          // Single-use, ~5min TTL — reset right away so a token can never be
          // resubmitted (e.g. on a retry after this attempt fails).
          reset();
          startTransition(() => {
            action(formData);
          });
        }}
      >
        {state.error && <p className={styles.formError}>{state.error}</p>}
        {next && <input type="hidden" name="next" value={next} />}

        <div className={styles.field}>
          <label htmlFor="email">Adresse e-mail</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
          required
          hint="Au moins 10 caractères, avec majuscule, minuscule, chiffre et caractère spécial."
        />
        <PasswordField id="password_confirm" name="password_confirm" label="Confirmer le mot de passe" autoComplete="new-password" required />

        <ProfileFieldsFieldset fieldErrors={state.fieldErrors} />

        {widget}

        <button className={styles.submit} type="submit" disabled={pending || (captchaRequired && !token)}>
          {pending ? "Création du compte…" : "Créer mon compte"}
        </button>
      </form>

      <p className={styles.switchLine}>
        Déjà un compte ? <Link href={withNext("/connexion", next)}>Se connecter</Link>
      </p>
    </>
  );
}
