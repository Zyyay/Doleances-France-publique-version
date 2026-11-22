"use client";

import { useEffect, useState } from "react";
import { AuthLink } from "@/components/auth/AuthLink";
import { giveSensitiveDataConsent } from "@/app/(auth)/actions";
import { submitPageFeedback } from "./actions";
import styles from "./FeedbackButton.module.css";

const MAX_LENGTH = 2000;

export function FeedbackButton({
  subjectId,
  isLoggedIn,
  triggerClassName,
}: {
  subjectId: string;
  isLoggedIn: boolean;
  triggerClassName?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showLoginPopin, setShowLoginPopin] = useState(false);
  const [showConsentPopin, setShowConsentPopin] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openFeedback() {
    if (!isLoggedIn) {
      setShowLoginPopin(true);
      return;
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setContent("");
  }

  async function handlePublish() {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await submitPageFeedback(subjectId, content);
      if (result.needsConsent) {
        setShowForm(false);
        setShowConsentPopin(true);
        return;
      }
      if (result.ok) {
        setShowForm(false);
        setContent("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAcceptConsent() {
    setIsSubmitting(true);
    try {
      const { ok } = await giveSensitiveDataConsent();
      setShowConsentPopin(false);
      if (ok) {
        setShowForm(true);
        await handlePublish();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!showForm && !showLoginPopin && !showConsentPopin) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      closeForm();
      setShowLoginPopin(false);
      setShowConsentPopin(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showForm, showLoginPopin, showConsentPopin]);

  return (
    <>
      <button className={triggerClassName ?? styles.trigger} type="button" onClick={openFeedback}>
        Donnez votre avis sur la page
      </button>

      {showForm && (
        <div className={styles.popinOverlay} onClick={closeForm}>
          <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
            <button className={styles.popinClose} onClick={closeForm} aria-label="Fermer" type="button">
              ×
            </button>
            <h4>Donnez votre avis sur la page</h4>
            <textarea
              className={styles.textarea}
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              maxLength={MAX_LENGTH}
              placeholder="Donnez votre avis sur le contenu de la page"
              autoFocus
            />
            <div className={styles.footerRow}>
              <span className={styles.counter}>
                {content.length} / {MAX_LENGTH}
              </span>
            </div>
            <div className={styles.popinActions}>
              <button className={styles.popinBtn} type="button" onClick={closeForm}>
                Annuler
              </button>
              <button
                className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                type="button"
                onClick={handlePublish}
                disabled={!content.trim() || isSubmitting}
              >
                Publier
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginPopin && (
        <div className={styles.popinOverlay} onClick={() => setShowLoginPopin(false)}>
          <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.popinClose}
              onClick={() => setShowLoginPopin(false)}
              aria-label="Fermer"
              type="button"
            >
              ×
            </button>
            <h4>Connecte-toi pour donner ton avis</h4>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>
              Le retour est réservé aux comptes inscrits. Tu peux continuer à naviguer sans compte.
            </p>
            <div className={styles.popinActions}>
              <AuthLink className={`${styles.popinBtn} ${styles.popinBtnPrimary}`} href="/inscription">
                Créer un compte
              </AuthLink>
              <AuthLink className={styles.popinBtn} href="/connexion">
                Se connecter
              </AuthLink>
            </div>
          </div>
        </div>
      )}

      {showConsentPopin && (
        <div className={styles.popinOverlay} onClick={() => setShowConsentPopin(false)}>
          <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.popinClose}
              onClick={() => setShowConsentPopin(false)}
              aria-label="Fermer"
              type="button"
            >
              ×
            </button>
            <h4>Avant de publier</h4>
            <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>
              Certains sujets peuvent révéler votre opinion politique — une donnée que le RGPD protège plus
              strictement. Vos votes et commentaires resteront privés et vous pouvez facilement tout supprimer.
            </p>
            <div className={styles.popinActions}>
              <button className={styles.popinBtn} type="button" onClick={() => setShowConsentPopin(false)}>
                Annuler
              </button>
              <button
                className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                type="button"
                onClick={handleAcceptConsent}
                disabled={isSubmitting}
              >
                J&apos;accepte et je continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
