import Link from "next/link";
import styles from "./SiteChrome.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link className={styles.brand} href="/">
            <img className={styles.brandMark} src="/logo.svg" alt="" aria-hidden="true" />
            Doléances
          </Link>
          <p>Le référendum permanent pour changer l&apos;action publique.</p>
        </div>
        <div className={styles.footerLinks}>
          <div className={styles.footerCol}>
            <h4>Plateforme</h4>
            <Link href="/">Tous les sujets</Link>
            <Link href="/a-propos#sources">Source de données</Link>
            <Link href="/a-propos#methodologie">Méthodologie</Link>
            <Link href="/a-propos#projet">A propos</Link>
            <Link href="/a-propos#mentions-legales">Mentions légales</Link>
            <Link href="/a-propos#confidentialite">Politique de confidentialité</Link>
          </div>
          <div className={styles.footerCol}>
            <h4>Assistance</h4>
            <Link href="/a-propos#contact">Nous contacter</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
