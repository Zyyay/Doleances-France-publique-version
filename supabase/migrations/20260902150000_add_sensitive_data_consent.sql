-- Explicit consent for Article 9 GDPR processing: several subjects on this
-- platform (immigration, sécurité, RIC, dissuasion nucléaire...) let a
-- vote or a free-text comment reveal a political opinion once tied to an
-- identified account — a "catégorie particulière de données" under
-- article 9, which requires its own legal basis distinct from the
-- contractual basis ("exécution du service") that covers account creation
-- and ordinary voting mechanics. The only realistic basis for an
-- independent citizen platform is explicit consent (art. 9(2)(a)).
--
-- Gated at write time (votes, page_feedback, subject proposals — see the
-- corresponding server actions), not only at signup: this also covers
-- every account created before this migration, the moment they next try to
-- vote/comment/propose, rather than only new signups going forward.

alter table public.profiles add column sensitive_data_consent_at timestamptz;

comment on column public.profiles.sensitive_data_consent_at is 'When the user explicitly consented to article-9 processing (votes/comments that may reveal a political opinion). Null = not yet asked, or withdrawn. Checked before every write to votes/page_feedback/subjects(source=''user'').';
