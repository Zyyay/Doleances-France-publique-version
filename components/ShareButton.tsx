"use client";

import { useEffect, useState, type ReactNode } from "react";
import styles from "./ShareButton.module.css";

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

/**
 * Native share sheet where available (mobile browsers), clipboard-copy
 * fallback everywhere else (most desktop browsers don't implement
 * navigator.share). `path` may be relative (e.g. "/sujets/x") — resolved
 * against window.location.origin at click time, so it's safe to render
 * server-side without causing a hydration mismatch.
 *
 * On success (native share handed off, or link copied) shows a brief
 * fixed-position confirmation — the single share-feedback surface used
 * everywhere in the app this button appears.
 */
export function ShareButton({
  path,
  text,
  className,
  label = "Partager",
  icon,
}: {
  path: string;
  text: string;
  className?: string;
  label?: string;
  icon?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => setConfirmed(false), 3200);
    return () => clearTimeout(timer);
  }, [confirmed]);

  async function handleShare() {
    const url = new URL(path, window.location.origin).toString();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: text, text, url });
        setConfirmed(true);
      } catch {
        // User dismissed the native share sheet — nothing to do.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setConfirmed(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — silently no-op.
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleShare}>
        {icon}
        {copied ? "Lien copié !" : label}
      </button>
      {confirmed && (
        <div className={styles.confirmToast} role="status">
          <span className={styles.confirmIcon} aria-hidden="true">
            <CheckIcon />
          </span>
          <div className={styles.confirmText}>
            <strong>Merci d&apos;avoir partagé !</strong>
            <p>Chaque partage aide à faire connaître la plateforme.</p>
          </div>
        </div>
      )}
    </>
  );
}
