import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./StatusScreen.module.css";

/**
 * Shared shell for app/not-found.tsx and app/error.tsx. Deliberately
 * self-contained — no SiteNav/SiteFooter, since those do an async Supabase
 * auth check, and an error screen that itself depends on a network call
 * defeats the point (a DB outage should never take the error page down
 * with it).
 */
export function StatusScreen({ title, message, actions }: { title: string; message: string; actions: ReactNode }) {
  return (
    <div className={styles.wrap}>
      <img className={styles.logo} src="/logo.svg" alt="" aria-hidden="true" />
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>{actions}</div>
    </div>
  );
}

export function HomeLink({ children, variant = "solid" }: { children: ReactNode; variant?: "solid" | "ghost" }) {
  return (
    <Link href="/" className={variant === "solid" ? styles.btnSolid : styles.btnGhost}>
      {children}
    </Link>
  );
}
