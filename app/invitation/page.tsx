import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import styles from "./invitation.module.css";

const title = "Vous avez été invité — Doléances";
const description = "Une majorité de Français s'accorde déjà sur de nombreux sujets. Ajoutez votre voix en 2 minutes.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description },
  twitter: { card: "summary_large_image", title, description },
};

export default function InvitationPage() {
  return (
    <>
      <SiteNav />
      <header id="main-content" className={styles.hero}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            On vous a envoyé ce lien
          </span>
          <h1 className={styles.title}>Un consensus existe déjà sur des dizaines de sujets.</h1>
          <p className={styles.sub}>
            Une majorité de Français s&apos;accorde, bien au-delà des étiquettes politiques — sans que ça pèse sur
            l&apos;action publique. Doléances vous donne une voix qui compte, en 2 minutes.
          </p>
          <div className={styles.cta}>
            <Link href="/vote-express" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              Démarrer un vote express
            </Link>
            <Link href="/#sujets" className={`${styles.ctaBtn} ${styles.ctaSecondary}`}>
              Ou explorer les sujets
            </Link>
          </div>
        </div>
      </header>
      <SiteFooter />
    </>
  );
}
