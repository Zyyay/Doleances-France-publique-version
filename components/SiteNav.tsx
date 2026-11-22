import Link from "next/link";
import { AuthLink } from "@/components/auth/AuthLink";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { MobileNav } from "@/components/MobileNav";
import { ProposeSubjectButton } from "@/components/ProposeSubjectButton";
import { getCurrentUser, isRealUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/subjects";
import styles from "./SiteChrome.module.css";

export async function SiteNav() {
  const [user, categories] = await Promise.all([getCurrentUser(), getCategories()]);
  const loggedIn = isRealUser(user);

  return (
    <>
      <a href="#main-content" className={styles.skipLink}>
        Aller au contenu
      </a>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link className={styles.brand} href="/" aria-label="Doléances — accueil">
            <img className={styles.brandMark} src="/logo.svg" alt="" aria-hidden="true" />
            Doléances
          </Link>
          <div className={styles.primaryLinks}>
            <CategoryDropdown categories={categories} />
          </div>
          <MobileNav categories={categories} />
          <div className={styles.secondaryLinks}>
            <Link href="/a-propos#sources">Source de données</Link>
            <Link href="/a-propos#methodologie">Méthodologie</Link>
            <Link href="/a-propos#projet">A propos</Link>
            <Link href="/a-propos#contact">Nous contacter</Link>
          </div>
          {loggedIn ? (
            <div className={styles.authActions}>
              <ProposeSubjectButton isLoggedIn={true} />
              <Link className={`${styles.btn} ${styles.btnGhost} ${styles.userEmailBtn}`} href="/compte" title={user.email}>
                Mon compte
              </Link>
            </div>
          ) : (
            <div className={styles.authActions}>
              <ProposeSubjectButton isLoggedIn={false} />
              <AuthLink className={`${styles.btn} ${styles.btnGhost}`} href="/connexion">
                Connexion
              </AuthLink>
              <AuthLink className={`${styles.btn} ${styles.btnSolid}`} href="/inscription">
                Inscription
              </AuthLink>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
