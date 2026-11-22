import { Suspense } from "react";
import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { SubjectBoard } from "@/components/SubjectBoard";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getSubjectsList } from "@/lib/subjects";
import styles from "./home.module.css";

export default async function Home() {
  const [subjects, categories, user] = await Promise.all([getSubjectsList(), getCategories(), getCurrentUser()]);

  let votedSubjectIds: string[] = [];
  if (user) {
    const supabase = await createClient();
    const { data: votes, error } = await supabase.from("votes").select("subject_id").eq("user_id", user.id);
    if (error) throw error;
    votedSubjectIds = (votes ?? []).map((v) => v.subject_id);
  }

  return (
    <>
      <SiteNav />

      <header id="main-content" className={styles.hero}>
        <div className={styles.seal} aria-hidden="true" />
        <div className={styles.wrap}>
          <div className={styles.heroInner}>
            <h1 className={styles.heroTitle}>Pour mettre au centre du débat les consensus citoyens. Sans étiquette, sans parti pris.</h1>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} aria-hidden="true" />
              Plateforme citoyenne indépendante
            </span>
              <p className={styles.heroTagline}>Votez, partagez, comptez.</p>
              <Link href="/a-propos" className={styles.aboutLink}>
                Notre démarche
                <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8 5l5 5-5 5" />
                </svg>
              </Link>
          </div>
          <div className={styles.heroCta}>
            <Link href="/vote-express" className={styles.promoCard}>
              <span className={styles.promoIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
                </svg>
              </span>
              <span className={styles.promoText}>
                <span className={styles.promoTitle}>Vote Express</span>
                <span className={styles.promoValue}>Faites peser votre avis dans la balance</span>
              </span>
              <span className={styles.promoArrow} aria-hidden="true">
                <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 5l5 5-5 5" />
                </svg>
              </span>
            </Link>
            <a href="#sujets" className={styles.heroCtaSecondary}>
              Ou explorer les sujets
            </a>
          </div>
        </div>
      </header>

      <Suspense fallback={null}>
        <SubjectBoard subjects={subjects} categories={categories} votedSubjectIds={votedSubjectIds} />
      </Suspense>

      <SiteFooter />
    </>
  );
}
