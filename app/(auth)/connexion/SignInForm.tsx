"use client";

import { startTransition, useActionState, useState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { useTurnstile } from "@/components/auth/useTurnstile";
import { signInWithEmail, type AuthFormState } from "../actions";
import styles from "@/components/auth/auth.module.css";

const initialState: AuthFormState = {};

export function SignInForm({ next }: { next: string | null }) {
  const [state, action, pending] = useActionState(signInWithEmail, initialState);
  const [email, setEmail] = useState("");
  const { token, widget, reset, required: captchaRequired } = useTurnstile();

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
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
      <PasswordField id="password" name="password" label="Mot de passe" autoComplete="current-password" required />

      {widget}

      <button className={styles.submit} type="submit" disabled={pending || (captchaRequired && !token)}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
