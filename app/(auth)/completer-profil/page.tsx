import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { safeNextPath, withNext } from "@/lib/auth/nextPath";
import { getCurrentUser, isRealUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/auth/auth.module.css";
import { CompleterProfilForm } from "./CompleterProfilForm";

export default async function CompleterProfilPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeNextPath((await searchParams).next);
  const user = await getCurrentUser();

  if (!isRealUser(user)) {
    redirect(withNext("/connexion", next));
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("birth_year, is_expat, department, education_level, gender")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <SiteNav />
      <div id="main-content" className={styles.wrap}>
        <div className={styles.card}>
          <h1 className={styles.title}>Compléter mon profil</h1>
          <p className={styles.subtitle}>
            Facultatif — ces informations servent uniquement à éclairer les résultats par profil, de façon
            anonymisée.
          </p>
          <CompleterProfilForm defaults={profile ?? {}} redirectTo={next ?? "/"} />
          <p className={styles.switchLine}>
            <Link href={next ?? "/"}>Passer cette étape</Link>
          </p>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
