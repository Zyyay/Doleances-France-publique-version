-- User-submitted subject proposals: rather than a separate table, a proposal
-- becomes a `subjects` row directly — 'pending' status keeps it out of every
-- public query (all of which already filter status = 'active') until an
-- admin fleshes out the full content (categories, synthesis, ideas...) and
-- flips it to 'active', or leaves it pending/archived to reject it.
--
-- Requires 20260901120000_add_subject_pending_status.sql to have been run
-- (and committed) first — see that file's comment.

alter table public.subjects add column source text not null default 'admin' check (source in ('admin', 'user'));
alter table public.subjects add column created_by uuid references auth.users(id) on delete set null;
alter table public.subjects add column proposal_message text;

alter table public.subjects add constraint subjects_source_created_by_check
  check ((source = 'user' and created_by is not null) or (source = 'admin' and created_by is null));

comment on column public.subjects.source is 'admin = hand-authored/pipeline content, user = submitted via "Proposer un sujet".';
comment on column public.subjects.created_by is 'The submitting user, set only when source = ''user''.';
comment on column public.subjects.proposal_message is 'Free-text pitch a user gave when proposing this subject (source = ''user'' only) — for admin review, never shown publicly.';

create index subjects_source_idx on public.subjects(source);

-- Tighten public read access: previously `using (true)`, safe only while
-- every row was admin-authored. Now that a row can be a pending, unmoderated
-- user submission, restrict direct reads (the anon key can query Supabase's
-- REST API directly, bypassing the app's own status filters) to active rows.
drop policy "Public can read subjects" on public.subjects;
create policy "Public can read active subjects" on public.subjects for select using (status = 'active');

-- Logged-in users may propose a subject: insert their own pending, user-sourced row.
create policy "Users can propose a subject" on public.subjects for insert
  with check (source = 'user' and created_by = auth.uid() and status = 'pending');
