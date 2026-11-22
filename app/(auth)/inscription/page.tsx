import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { GOOGLE_AUTH_ENABLED } from "@/lib/auth/featureFlags";
import { safeNextPath } from "@/lib/auth/nextPath";
import styles from "@/components/auth/auth.module.css";
import { SignUpForm } from "./SignUpForm";

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNextPath((await searchParams).next);

  return (
    <>
      <SiteNav />
      <div id="main-content" className={styles.wrap}>
        <div className={styles.card}>
          <SignUpForm googleEnabled={GOOGLE_AUTH_ENABLED} next={next} />
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
