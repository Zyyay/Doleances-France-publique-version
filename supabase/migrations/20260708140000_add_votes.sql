-- One vote per (user, subject) — a new vote overwrites the previous one in
-- place (upsert on the primary key), no history is kept and no separate
-- status column exists. `vote_count` on `results` stays an aggregate the
-- frontend can read publicly without exposing who voted for what; a trigger
-- keeps it in sync so the app never has to touch it directly.

-- Composite unique key so `votes.result_id` can be constrained to actually
-- belong to `votes.subject_id` (id alone is already unique; this just adds
-- the (id, subject_id) pair as a referenceable unique key).
alter table public.results add constraint results_id_subject_id_unique unique (id, subject_id);

create table public.votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  result_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id),
  foreign key (result_id, subject_id) references public.results(id, subject_id)
);

comment on table public.votes is 'One row per user per subject — which result option they last chose. Overwritten in place on re-vote, never a history.';

create index votes_subject_id_idx on public.votes(subject_id);
create index votes_result_id_idx on public.votes(result_id);

create trigger votes_set_updated_at
before update on public.votes
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Keep results.vote_count in sync with votes. Security definer because the
-- voting user only has RLS rights over their own `votes` row, not write
-- access to `results` (public-read-only, see subjects migration) — same
-- bypass-RLS-on-purpose pattern as handle_new_user() for profiles.
-- ---------------------------------------------------------------------------
create or replace function public.sync_result_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.results set vote_count = vote_count + 1 where id = new.result_id;
  elsif tg_op = 'UPDATE' then
    if new.result_id <> old.result_id then
      update public.results set vote_count = vote_count - 1 where id = old.result_id;
      update public.results set vote_count = vote_count + 1 where id = new.result_id;
    end if;
  elsif tg_op = 'DELETE' then
    update public.results set vote_count = vote_count - 1 where id = old.result_id;
  end if;
  return null;
end;
$$;

create trigger votes_sync_vote_count
after insert or update or delete on public.votes
for each row execute function public.sync_result_vote_count();

-- ---------------------------------------------------------------------------
-- RLS — a user can only ever see/write their own vote row. No public read:
-- individual votes stay private, only the aggregated results.vote_count is
-- public (see subjects migration).
-- ---------------------------------------------------------------------------
alter table public.votes enable row level security;

create policy "Users can read own vote" on public.votes for select using (auth.uid() = user_id);
create policy "Users can insert own vote" on public.votes for insert with check (auth.uid() = user_id);
create policy "Users can update own vote" on public.votes for update using (auth.uid() = user_id);
