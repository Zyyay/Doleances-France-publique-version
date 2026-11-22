"use client";

import { useEffect, useState, useTransition } from "react";
import { AuthLink } from "@/components/auth/AuthLink";
import { VoteToast } from "@/components/VoteToast";
import { giveSensitiveDataConsent, resendConfirmationEmail } from "@/app/(auth)/actions";
import type { ResultRow, SubjectCard } from "@/lib/subjects";
import { castVote } from "./actions";
import subjectStyles from "./subject.module.css";
import styles from "./VoteCard.module.css";

function segmentColor(leaning: number): string {
  if (leaning <= -2) return "var(--contre)";
  if (leaning < 0) return "color-mix(in srgb, var(--contre) 55%, var(--track))";
  if (leaning === 0) return "color-mix(in srgb, var(--ink-faint) 30%, var(--surface-sunken))";
  if (leaning < 2) return "color-mix(in srgb, var(--pour) 55%, var(--track))";
  return "var(--pour)";
}

export function VoteCard({
  subjectId,
  subjectSlug,
  subjectTitle,
  card,
  isLoggedIn,
  votedResultId,
  results,
}: {
  subjectId: string;
  subjectSlug: string;
  subjectTitle: string;
  card: SubjectCard | null;
  isLoggedIn: boolean;
  votedResultId: string | null;
  results: ResultRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [showLoginPopin, setShowLoginPopin] = useState(false);
  const [showConsentPopin, setShowConsentPopin] = useState(false);
  const [showEmailConfirmPopin, setShowEmailConfirmPopin] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [pendingResultId, setPendingResultId] = useState<string | null>(null);
  const [localVotedResultId, setLocalVotedResultId] = useState(votedResultId);
  const [toast, setToast] = useState<{ choice: string; pct: number; positive: boolean } | null>(null);

  function handleVote(resultId: string) {
    if (!isLoggedIn) {
      setShowLoginPopin(true);
      return;
    }
    const chosen = results.find((r) => r.id === resultId);
    const choiceLabel = chosen?.label ?? "";
    startTransition(async () => {
      const result = await castVote(subjectId, resultId);
      if (result.needsEmailConfirmation) {
        setShowEmailConfirmPopin(true);
        return;
      }
      if (result.needsConsent) {
        setPendingResultId(resultId);
        setShowConsentPopin(true);
        return;
      }
      if (result.ok) {
        setLocalVotedResultId(resultId);
        // Prefer the fresh post-vote counts the server just returned — the
        // page's `results` prop is a stale SSR snapshot and can't be trusted
        // to match what a refresh would show.
        const freshResults = result.results ?? results;
        const freshTotal = freshResults.reduce((sum, r) => sum + r.vote_count, 0);
        const freshChoiceCount = freshResults.find((r) => r.id === resultId)?.vote_count ?? 0;
        const choicePct = freshTotal > 0 ? Math.round((freshChoiceCount / freshTotal) * 100) : 0;
        setToast({ choice: choiceLabel, pct: choicePct, positive: (chosen?.leaning ?? 0) > 0 });
      }
    });
  }

  function handleAcceptConsent() {
    startTransition(async () => {
      const { ok } = await giveSensitiveDataConsent();
      setShowConsentPopin(false);
      if (ok && pendingResultId) handleVote(pendingResultId);
      setPendingResultId(null);
    });
  }

  function handleResendConfirmation() {
    setResendStatus("sending");
    startTransition(async () => {
      const { ok } = await resendConfirmationEmail();
      setResendStatus(ok ? "sent" : "idle");
    });
  }

  useEffect(() => {
    if (!showLoginPopin && !showConsentPopin && !showEmailConfirmPopin) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLoginPopin(false);
        setShowConsentPopin(false);
        setShowEmailConfirmPopin(false);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [showLoginPopin, showConsentPopin, showEmailConfirmPopin]);

  const hasVoted = !!localVotedResultId;
  const total = results.reduce((sum, r) => sum + r.vote_count, 0);
  const segments = results.map((r) => ({ ...r, pct: total > 0 ? (r.vote_count / total) * 100 : 0 }));
  const resultsUnlocked = isLoggedIn && hasVoted;

  const resultsContent =
    results.length === 0 ? (
      <p className={styles.emptyResults}>Le vote n&apos;est pas encore ouvert sur ce sujet.</p>
    ) : resultsUnlocked ? (
      <>
        <div className={styles.resultLegend}>
          {segments.map((s) => (
            <span className={styles.item} key={s.id}>
              <span className={styles.dot} style={{ background: segmentColor(s.leaning) }} />
              {s.label} {Math.round(s.pct)} %
            </span>
          ))}
        </div>
        <div className={styles.compareBarWrap}>
          <div className={styles.divergingBar}>
            {segments.map((s) => (
              <span key={s.id} style={{ width: `${s.pct}%`, background: segmentColor(s.leaning) }} />
            ))}
          </div>
        </div>
      </>
    ) : (
      <p className={styles.resultsLockedHint}>
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <rect x="4.5" y="9" width="11" height="7.5" rx="1.5" />
          <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" />
        </svg>
        Votez pour découvrir le résultat.
      </p>
    );

  return (
    <>
      <div className={styles.resultsSection}>
        <div className={subjectStyles.wrap}>
          <span className={styles.resultsHeading}>Résultats</span>
          {resultsContent}
        </div>
      </div>

      <div className={styles.voteBar}>
        <div className={styles.voteButtons}>
          {results.map((option) => {
            const isSelected = option.id === localVotedResultId;
            return (
              <div
                className={`${styles.voteOption} ${hasVoted && !isSelected ? styles.voteOptionDimmed : ""}`}
                key={option.id}
              >
                <button
                  className={`${styles.voteBtn} ${option.leaning > 0 ? styles.voteBtnPour : styles.voteBtnContre} ${
                    isSelected ? styles.voteBtnSelected : ""
                  }`}
                  disabled={isPending}
                  onClick={() => handleVote(option.id)}
                  aria-label={option.label}
                  aria-pressed={isSelected}
                >
                  {option.leaning > 0 ? (
                    <svg viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 10.5l4 4 8-9" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M5 5l10 10M15 5L5 15" />
                    </svg>
                  )}
                </button>
                <span className={styles.voteBtnLabel}>{option.label}</span>
              </div>
            );
          })}
        </div>

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
              <h4>Connectez-vous pour voter</h4>
              <p>
                Le vote est réservé aux comptes inscrits, pour garantir un citoyen = une voix. Vous pouvez continuer
                à naviguer sans compte.
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
              <h4>Avant de voter</h4>
              <p>
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
                  disabled={isPending}
                >
                  J&apos;accepte et je continue
                </button>
              </div>
            </div>
          </div>
        )}

        {showEmailConfirmPopin && (
          <div className={styles.popinOverlay} onClick={() => setShowEmailConfirmPopin(false)}>
            <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
              <button
                className={styles.popinClose}
                onClick={() => setShowEmailConfirmPopin(false)}
                aria-label="Fermer"
                type="button"
              >
                ×
              </button>
              <h4>Confirme ton e-mail pour voter</h4>
              <p>
                Le vote est réservé aux comptes dont l&apos;adresse e-mail est confirmée, pour garantir un citoyen =
                une voix. Clique sur le lien reçu à ton inscription, ou renvoie-le si besoin.
              </p>
              <div className={styles.popinActions}>
                <button className={styles.popinBtn} type="button" onClick={() => setShowEmailConfirmPopin(false)}>
                  Plus tard
                </button>
                <button
                  className={`${styles.popinBtn} ${styles.popinBtnPrimary}`}
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendStatus !== "idle"}
                >
                  {resendStatus === "sent" ? "E-mail renvoyé !" : resendStatus === "sending" ? "Envoi…" : "Renvoyer l'e-mail"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <VoteToast
          vote={{ subjectId, subjectSlug, subjectTitle, card, ...toast }}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
