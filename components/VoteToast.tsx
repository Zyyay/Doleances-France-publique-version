"use client";

import { useEffect } from "react";
import { SubjectShareActions } from "@/components/SubjectShareActions";
import { FeedbackButton } from "@/app/sujets/[slug]/FeedbackButton";
import type { SubjectCard } from "@/lib/subjects";
import styles from "./VoteToast.module.css";

/**
 * Post-vote confirmation, mounted by VoteCard right after a vote succeeds
 * and unmounted through `onClose`. Shows where the voter's choice stands,
 * then offers to share the subject. It never auto-dismisses: a few seconds
 * is too short to decide to share.
 */
export function VoteToast({
  vote,
  onClose,
}: {
  vote: {
    subjectId: string;
    subjectSlug: string;
    subjectTitle: string;
    /** Label of the option the voter picked, e.g. "Pour". */
    choice: string;
    /** That option's share of all votes, fresh from the server after this vote. */
    pct: number;
    /** Whether the option leans "Pour" — colours the percentage. */
    positive: boolean;
    /** Share-card fact, so the share texts match the preview image. */
    card: SubjectCard | null;
  };
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.toast} role="status" onClick={(e) => e.stopPropagation()}>
        <strong>Merci pour votre vote !</strong>
        <p className={styles.pctLine}>
          Vous rejoignez les{" "}
          <strong style={{ color: vote.positive ? "var(--pour)" : "var(--contre)" }}>{vote.pct} %</strong> qui ont voté «{" "}
          {vote.choice} ».
        </p>
        <SubjectShareActions slug={vote.subjectSlug} title={vote.subjectTitle} card={vote.card} />
        <FeedbackButton subjectId={vote.subjectId} isLoggedIn triggerClassName={styles.feedbackTrigger} />
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>
    </div>
  );
}
