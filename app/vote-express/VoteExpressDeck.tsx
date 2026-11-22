"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type PointerEvent as ReactPointerEvent } from "react";
import Link from "next/link";
import { AuthLink } from "@/components/auth/AuthLink";
import { CategoryBadge, categoryColorVar } from "@/components/CategoryBadge";
import { ShareButton } from "@/components/ShareButton";
import { giveSensitiveDataConsent, resendConfirmationEmail } from "@/app/(auth)/actions";
import type { VoteExpressSubject } from "@/lib/subjects";
import { castQuickVote } from "./actions";
import styles from "./VoteExpressDeck.module.css";

const SWIPE_THRESHOLD = 110;

export function VoteExpressDeck({ subjects, isLoggedIn }: { subjects: VoteExpressSubject[]; isLoggedIn: boolean }) {
  const [index, setIndex] = useState(0);
  const [votedCount, setVotedCount] = useState(0);
  const [voteHistory, setVoteHistory] = useState<Array<"left" | "right">>([]);
  // First/last successful vote, for the real session length quoted in the share text.
  const [voteSpan, setVoteSpan] = useState<{ first: number; last: number } | null>(null);
  const [showLoginPopin, setShowLoginPopin] = useState(false);
  const [showConsentPopin, setShowConsentPopin] = useState(false);
  const [showEmailConfirmPopin, setShowEmailConfirmPopin] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [pendingVote, setPendingVote] = useState<{ resultId: string; direction: "left" | "right" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<"left" | "right" | null>(null);
  const dragStartX = useRef(0);
  const pointerId = useRef<number | null>(null);

  const subject = subjects[index];
  const total = subjects.length;
  const done = index >= total;

  const pourResult = subject ? subject.results.find((r) => r.leaning > 0) ?? subject.results[subject.results.length - 1] : null;
  const contreResult = subject ? subject.results.find((r) => r.leaning < 0) ?? subject.results[0] : null;
  const canSwipe = subject ? subject.results.length === 2 : false;

  const advance = useCallback(() => {
    setDragX(0);
    setDragging(false);
    setExiting(null);
    setIndex((i) => i + 1);
  }, []);

  const commitVote = useCallback(
    (resultId: string | undefined, direction: "left" | "right") => {
      if (!subject || !resultId) return;
      if (!isLoggedIn) {
        setShowLoginPopin(true);
        setDragX(0);
        setDragging(false);
        return;
      }
      setExiting(direction);
      startTransition(async () => {
        // Race the request against a fixed delay so the fly-out/stamp
        // animation always gets to finish, even on a fast local response.
        const [result] = await Promise.all([
          castQuickVote(subject.id, resultId),
          new Promise((resolve) => setTimeout(resolve, 260)),
        ]);
        if (result.needsEmailConfirmation) {
          setExiting(null);
          setShowEmailConfirmPopin(true);
          return;
        }
        if (result.needsConsent) {
          setExiting(null);
          setPendingVote({ resultId, direction });
          setShowConsentPopin(true);
          return;
        }
        setVotedCount((c) => c + 1);
        setVoteHistory((h) => [...h, direction]);
        const now = Date.now();
        setVoteSpan((span) => ({ first: span?.first ?? now, last: now }));
        advance();
      });
    },
    [subject, isLoggedIn, advance, startTransition]
  );

  const handleAcceptConsent = useCallback(() => {
    startTransition(async () => {
      const { ok } = await giveSensitiveDataConsent();
      setShowConsentPopin(false);
      if (ok && pendingVote) commitVote(pendingVote.resultId, pendingVote.direction);
      setPendingVote(null);
    });
  }, [pendingVote, commitVote, startTransition]);

  const handleResendConfirmation = useCallback(() => {
    setResendStatus("sending");
    startTransition(async () => {
      const { ok } = await resendConfirmationEmail();
      setResendStatus(ok ? "sent" : "idle");
    });
  }, [startTransition]);

  const skip = useCallback(() => {
    if (!subject) return;
    advance();
  }, [subject, advance]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (!canSwipe || isPending) return;
    if ((e.target as HTMLElement).closest("a, button")) return;
    pointerId.current = e.pointerId;
    dragStartX.current = e.clientX;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    setDragX(e.clientX - dragStartX.current);
  }

  function handlePointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging || pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setDragging(false);
    if (dragX > SWIPE_THRESHOLD) {
      commitVote(pourResult?.id, "right");
    } else if (dragX < -SWIPE_THRESHOLD) {
      commitVote(contreResult?.id, "left");
    } else {
      setDragX(0);
    }
  }

  useEffect(() => {
    if (done) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowLoginPopin(false);
        setShowConsentPopin(false);
        setShowEmailConfirmPopin(false);
        return;
      }
      if (showLoginPopin || showConsentPopin || showEmailConfirmPopin) return;
      if (e.key === "ArrowRight") commitVote(pourResult?.id, "right");
      else if (e.key === "ArrowLeft") commitVote(contreResult?.id, "left");
      else if (e.key === " " || e.key === "ArrowDown") skip();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [done, commitVote, skip, pourResult, contreResult, showLoginPopin, showConsentPopin, showEmailConfirmPopin]);

  // Points at a short dedicated landing page (not the bare homepage) — it
  // carries its own pitch/CTA for someone arriving cold from a shared link,
  // and its own OG image so the link preview looks right on
  // WhatsApp/iMessage/Slack/X/etc. Says how many votes, never which way.
  // Minutes run from the first to the last vote, rounded up.
  const shareMinutes = voteSpan ? Math.max(1, Math.ceil((voteSpan.last - voteSpan.first) / 60000)) : 0;
  const shareHook = "Prisons, dette, RIC : les Français sont d'accord sur bien plus de sujets qu'on ne le croit.";
  const shareText =
    votedCount > 0
      ? `${shareHook}\n${shareMinutes} minute${shareMinutes > 1 ? "s" : ""}, ${votedCount} vote${votedCount > 1 ? "s" : ""} : j'ai fait entendre ma voix. Faites entendre la vôtre 👉`
      : `${shareHook}\nQuelques minutes suffisent pour faire entendre sa voix 👉`;

  const cardStyle = useMemo(() => {
    if (exiting) {
      const flyX = exiting === "right" ? 640 : -640;
      const flyRotate = exiting === "right" ? 22 : -22;
      return {
        transform: `translateX(${flyX}px) rotate(${flyRotate}deg)`,
        opacity: 0,
        transition: "transform 0.26s ease, opacity 0.26s ease",
      };
    }
    const rotate = dragX / 18;
    return {
      transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
      transition: dragging ? "none" : "transform 0.25s ease",
    };
  }, [dragX, dragging, exiting]);

  const dragProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const dragDirection = exiting ?? (dragX > 8 ? "right" : dragX < -8 ? "left" : null);
  const stampOpacity = exiting ? 1 : dragProgress;

  if (total === 0 && !done) {
    return (
      <div className={styles.emptyState}>
        <h1 className={styles.emptyTitle}>Vote Express</h1>
        <p>Vous avez déjà voté sur tous les sujets ouverts au vote. Merci pour votre participation !</p>
        <Link href="/" className={styles.homeLink}>
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.endScreen}>
        <div className={styles.endBrand}>
          <img className={styles.endBrandMark} src="/logo.svg" alt="" aria-hidden="true" />
          Doléances
        </div>
        <h1 className={styles.endTitle}>Merci pour votre participation !</h1>
        <p className={styles.endSub}>
          {votedCount > 0
            ? `Vous avez voté sur ${votedCount} sujet${votedCount > 1 ? "s" : ""}.`
            : "Vous avez parcouru tous les sujets disponibles."}
        </p>
        {voteHistory.length > 0 && (
          <div className={styles.recapCard}>
            <span className={styles.recapLabel}>Votre parcours</span>
            <div className={styles.recapDots}>
              {voteHistory.map((direction, i) => (
                <span
                  key={i}
                  className={`${styles.recapDot} ${direction === "right" ? styles.recapDotPour : styles.recapDotContre}`}
                />
              ))}
            </div>
          </div>
        )}
        <div className={styles.endActions}>
          <ShareButton
            path="/invitation"
            text={shareText}
            className={styles.shareBtn}
            label="Partager la plateforme"
            icon={
              <svg viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="15" cy="4.5" r="2.2" />
                <circle cx="5" cy="10" r="2.2" />
                <circle cx="15" cy="15.5" r="2.2" />
                <path d="M7 8.8 13 5.7M7 11.2 13 14.3" />
              </svg>
            }
          />
          <Link href="/" className={styles.homeLink}>
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.stage}>
      <div className={styles.topBar}>
        <span className={styles.brand}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
          </svg>
          Vote Express
        </span>
        <span className={styles.counter}>
          {index + 1} / {total}
        </span>
      </div>

      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.sideBtn} ${styles.contreBtn}`}
          onClick={() => commitVote(contreResult?.id, "left")}
          disabled={isPending || !contreResult}
          aria-label="Contre"
        >
          <svg viewBox="0 0 20 20" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>

        <div className={styles.cardCol}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${(index / total) * 100}%` }} />
          </div>

          <div
            className={styles.card}
            style={cardStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {dragDirection && (
              <span
                className={`${styles.stamp} ${dragDirection === "right" ? styles.stampPour : styles.stampContre}`}
                style={{ opacity: stampOpacity }}
                aria-hidden="true"
              >
                {dragDirection === "right" ? "Pour" : "Contre"}
              </span>
            )}

            <div className={styles.cardHead}>
              {subject.category && (
                <span
                  className={styles.catChip}
                  style={{ background: `color-mix(in srgb, var(${categoryColorVar(subject.category.slug)}) 14%, transparent)`, color: `var(${categoryColorVar(subject.category.slug)})` }}
                >
                  <CategoryBadge slug={subject.category.slug} size={24} />
                  {subject.category.name}
                </span>
              )}
            </div>

            <div className={styles.questionWrap}>
              <h2 className={styles.question}>{subject.title}</h2>
            </div>

            <Link
              href={`/sujets/${subject.slug}`}
              prefetch={false}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.moreLink}
              onPointerDown={(e) => e.stopPropagation()}
            >
              Explorer le sujet 🔎
            </Link>
          </div>

          <button type="button" className={styles.skipRow} onClick={skip} disabled={isPending}>
            Passer
          </button>
        </div>

        <button
          type="button"
          className={`${styles.sideBtn} ${styles.pourBtn}`}
          onClick={() => commitVote(pourResult?.id, "right")}
          disabled={isPending || !pourResult}
          aria-label="Pour"
        >
          <svg viewBox="0 0 20 20" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10.5l4 4 8-9" />
          </svg>
        </button>
      </div>

      <p className={styles.hint}>Glissez la carte, ou utilisez les boutons — flèches du clavier sur ordinateur.</p>

      {showLoginPopin && (
        <div className={styles.popinOverlay} onClick={() => setShowLoginPopin(false)}>
          <div className={styles.popin} onClick={(e) => e.stopPropagation()}>
            <button className={styles.popinClose} onClick={() => setShowLoginPopin(false)} aria-label="Fermer" type="button">
              ×
            </button>
            <h4>Connectez-vous pour voter</h4>
            <p>
              Le vote est réservé aux comptes inscrits, pour garantir un citoyen = une voix. Vous pouvez continuer à
              naviguer sans compte.
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
  );
}
