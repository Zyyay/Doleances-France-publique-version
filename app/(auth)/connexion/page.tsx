import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth/featureFlags";
import { safeNextPath, withNext } from "@/lib/auth/nextPath";
import styles from "@/components/auth/auth.module.css";
import { SignInForm } from "./SignInForm";

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNextPath((await searchParams).next);

  return (
    <>
      <SiteNav />
      <div id="main-content" className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Connexion</h1>
          <p className={styles.subtitle}>Accède à ton compte pour voter et suivre les sujets.</p>

          {GOOGLE_AUTH_ENABLED && (
            <>
              <GoogleButton next={next} />
              <div className={styles.divider}>ou</div>
            </>
          )}

          <SignInForm next={next} />

          <p className={styles.switchLine}>
            Pas encore de compte ? <Link href={withNext("/inscription", next)}>S&apos;inscrire</Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
