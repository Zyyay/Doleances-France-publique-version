"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthLink } from "@/components/auth/AuthLink";
import { giveSensitiveDataConsent } from "@/app/(auth)/actions";
import { proposeSubject } from "@/app/actions";
import { useIsClient } from "@/lib/useIsClient";
import styles from "./ProposeSubjectButton.module.css";

const TITLE_MAX = 140;
const MESSAGE_MAX = 600;

export function ProposeSubjectButton({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [showForm, setShowForm] = useState(false);
  const [showLoginPopin, setShowLoginPopin] = useState(false);
  const [showConsentPopin, setShowConsentPopin] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mounted = useIsClient();

  function openPropose() {
    if (!isLoggedIn) {
      setShowLoginPopin(true);
      return;
    }
    setShowForm(true);
  }

  function closeAll() {
    setShowForm(false);
    setShowLoginPopin(false);
    setShowConsentPopin(false);
    setShowThanks(false);
    setTitle("");
    setMessage("");
    setWebsite("");
  }

  async function handleSubmit() {
    if (!title.trim() || !message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { ok, needsConsent } = await proposeSubject(title, message, website);
      if (needsConsent) {
        setShowForm(false);
        setShowConsentPopin(true);
        return;
      }
      if (ok) {
        setShowForm(false);
        setTitle("");
        setMessage("");
        setShowThanks(true);
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
        await handleSubmit();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!showForm && !showLoginPopin && !showConsentPopin && !showThanks) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showForm, showLoginPopin, showConsentPopin, showThanks]);

  return (
    <>
      <button className={styles.trigger} type="button" onClick={openPropose}>
        <svg
          viewBox="0 0 20 20"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M10 4v12M4 10h12" />
        </svg>
        Proposer un sujet
      </button>

      {mounted &&
        (showForm || showLoginPopin || showConsentPopin || showThanks) &&
        createPortal(
          <>
            {showForm && (
              <div className={styles.popinOverlay} onClick={closeAll}>
                <div
                  className={styles.popin}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles.popinClose}
                    onClick={closeAll}
                    aria-label="Fermer"
                    type="button"
                  >
                    ×
                  </button>
                  <h4>Proposer un sujet</h4>

                  <label className={styles.fieldLabel} htmlFor="proposeTitle">
                    Titre du sujet
                  </label>
                  <input
                    id="proposeTitle"
                    className={styles.titleInput}
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value.slice(0, TITLE_MAX))
                    }
                    maxLength={TITLE_MAX}
                    placeholder="Ex. Encadrer le lobbying à l'Assemblée"
                    autoFocus
                  />

                  <label className={styles.fieldLabel} htmlFor="proposeMessage">
                    En quelques mots
                  </label>
                  <textarea
                    id="proposeMessage"
                    className={styles.textarea}
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value.slice(0, MESSAGE_MAX))
                    }
                    maxLength={MESSAGE_MAX}
                    placeholder="Pourquoi ce sujet mérite sa place sur la plateforme, en 2-3 phrases"
                  />

                  <div className={styles.honeypot} aria-hidden="true">
                    <label htmlFor="proposeWebsite">Ne pas remplir</label>
                    <input
                      id="proposeWebsite"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div className={styles.footerRow}>
                    <span className={styles.counter}>
                      {message.length} / {MESSAGE_MAX}
                    </span>
                  </div>
                  <div className={styles.popinActions}>
                    <button
                      className={styles.popinBtn}
                      type="button"
                      onClick={closeAll}
                    >
                      Annuler
                    </button>
                    <button
                      className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                      type="button"
                      onClick={handleSubmit}
                      disabled={
                        !title.trim() || !message.trim() || isSubmitting
                      }
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showLoginPopin && (
              <div className={styles.popinOverlay} onClick={closeAll}>
                <div
                  className={styles.popin}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles.popinClose}
                    onClick={closeAll}
                    aria-label="Fermer"
                    type="button"
                  >
                    ×
                  </button>
                  <h4>Connecte-toi pour proposer un sujet</h4>
                  <p
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: "var(--ink-soft)",
                    }}
                  >
                    Proposer un sujet est réservé aux comptes inscrits. Tu peux
                    continuer à naviguer sans compte.
                  </p>
                  <div className={styles.popinActions}>
                    <AuthLink
                      className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                      href="/inscription"
                    >
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
              <div className={styles.popinOverlay} onClick={closeAll}>
                <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.popinClose} onClick={closeAll} aria-label="Fermer" type="button">
                    ×
                  </button>
                  <h4>Avant d&apos;envoyer</h4>
                  <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-soft)" }}>
                    Certains sujets peuvent révéler votre opinion politique — une donnée que le RGPD protège plus
                    strictement. Vos votes et commentaires resteront privés et vous pouvez facilement tout
                    supprimer.
                  </p>
                  <div className={styles.popinActions}>
                    <button className={styles.popinBtn} type="button" onClick={closeAll}>
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

            {showThanks && (
              <div className={styles.popinOverlay} onClick={closeAll}>
                <div
                  className={styles.popin}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className={styles.popinClose}
                    onClick={closeAll}
                    aria-label="Fermer"
                    type="button"
                  >
                    ×
                  </button>
                  <div className={styles.thankYouIcon}>
                    <svg
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className={styles.center}>
                    Merci pour votre proposition !
                  </h4>
                  <p className={styles.thankYouBody}>
                    Elle a bien été transmise à l&apos;équipe. Aucun autre suivi
                    n&apos;est nécessaire de votre côté.
                  </p>
                  <div className={styles.popinActions}>
                    <button
                      className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                      type="button"
                      onClick={closeAll}
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
