import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser, isRealUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/auth/auth.module.css";
import { CompleterProfilForm } from "../(auth)/completer-profil/CompleterProfilForm";
import { signOut } from "../(auth)/actions";

export default async function ComptePage() {
  const user = await getCurrentUser();

  if (!isRealUser(user)) {
    redirect("/connexion");
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
          <h1 className={styles.title}>Mon compte</h1>
          <p className={styles.subtitle}>{user.email}</p>

          <CompleterProfilForm defaults={profile ?? {}} />

          <form action={signOut} style={{ marginTop: 20 }}>
            <button className={styles.googleButton} type="submit">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
