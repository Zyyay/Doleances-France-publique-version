-- Split out from the subject_proposals migration: a new enum value must be
-- committed before it can be used (Postgres error 55P04), and Supabase's SQL
-- Editor runs a whole pasted script as one transaction — so this needs to
-- run, and commit, before 20260901120100_add_subject_proposals.sql.

alter type public.subject_status add value 'pending';
