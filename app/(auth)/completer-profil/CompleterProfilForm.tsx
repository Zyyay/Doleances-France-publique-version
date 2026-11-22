"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { ProfileFieldsFieldset, type ProfileFieldDefaults } from "@/components/auth/ProfileFieldsFieldset";
import { updateProfile, type AuthFormState } from "../actions";
import styles from "@/components/auth/auth.module.css";

const initialState: AuthFormState = {};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function CompleterProfilForm({
  defaults,
  redirectTo,
}: {
  defaults: ProfileFieldDefaults;
  /** Where to send the user after saving — defaults to staying on /compte with a confirmation (see updateProfile). Set this when reusing the form outside the account page. */
  redirectTo?: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, initialState);
  // Each save returns a fresh state object, so keying the dismissal on it
  // lets a second save show the toast again.
  const [dismissedState, setDismissedState] = useState<AuthFormState | null>(null);
  const showSaved = Boolean(state.message) && dismissedState !== state;

  useEffect(() => {
    if (!state.message) return;
    const timer = setTimeout(() => setDismissedState(state), 3200);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(() => {
          action(formData);
        });
      }}
    >
      {redirectTo && <input type="hidden" name="redirect_to" value={redirectTo} />}
      {state.error && <p className={styles.formError}>{state.error}</p>}
      <ProfileFieldsFieldset defaults={defaults} fieldErrors={state.fieldErrors} />
      <button className={styles.submit} type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {showSaved && (
        <div className={styles.savedToast} role="status">
          <span className={styles.savedIcon} aria-hidden="true">
            <CheckIcon />
          </span>
          {state.message}
        </div>
      )}
    </form>
  );
}
