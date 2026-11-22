import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { getCurrentUser, isRealUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getVoteExpressSubjects } from "@/lib/subjects";
import { VoteExpressDeck } from "./VoteExpressDeck";
import styles from "./voteExpress.module.css";

export default async function VoteExpressPage() {
  const [subjects, user] = await Promise.all([getVoteExpressSubjects(), getCurrentUser()]);

  const loggedIn = isRealUser(user);

  let votedSubjectIds: string[] = [];
  if (loggedIn) {
    const supabase = await createClient();
    const { data: votes, error } = await supabase.from("votes").select("subject_id").eq("user_id", user.id);
    if (error) throw error;
    votedSubjectIds = (votes ?? []).map((v) => v.subject_id);
  }

  const votedSet = new Set(votedSubjectIds);
  const deck = subjects.filter((s) => !votedSet.has(s.id));

  return (
    <>
      <SiteNav />
      <main id="main-content" className={styles.page}>
        <VoteExpressDeck subjects={deck} isLoggedIn={loggedIn} />
      </main>
      <SiteFooter />
    </>
  );
}
