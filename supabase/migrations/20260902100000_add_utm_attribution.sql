-- UTM attribution for votes/accounts (X, Threads, Reddit acquisition) — no
-- third-party analytics, no new cookie: reuses the Supabase Auth session,
-- extended to anonymous visitors (see proxy.ts) so a first-touch UTM survives
-- browsing between clicking a shared link and creating a real account or
-- voting.
--
-- 'direct' is a real, explicit stored value (not null) whenever no UTM was
-- ever present, so null in this data always means a tracking bug, never "no
-- source". First touch wins forever: once a value is set (including
-- 'direct'), it is never overwritten by a later visit.

alter table public.profiles
  add column utm_source text not null default 'direct' check (utm_source in ('x', 'threads', 'reddit', 'direct')),
  add column utm_medium text not null default 'direct' check (utm_medium in ('plateforme', 'perso', 'direct')),
  add column utm_campaign text not null default 'direct'
    check (utm_campaign = 'direct' or utm_campaign ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.votes
  add column utm_source text check (utm_source in ('x', 'threads', 'reddit', 'direct')),
  add column utm_medium text check (utm_medium in ('plateforme', 'perso', 'direct')),
  add column utm_campaign text
    check (utm_campaign is null or utm_campaign = 'direct' or utm_campaign ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

comment on column public.profiles.utm_source is 'First-touch attribution, set once at account/anonymous-session creation, never overwritten. ''direct'' = no UTM was ever present (not the same as null, which would mean a tracking bug).';
comment on column public.votes.utm_source is 'Copied from the voter''s profile at vote-insert time (see handle_vote_utm trigger), then locked — a re-vote (upsert in place) never overwrites it.';

-- ---------------------------------------------------------------------------
-- handle_new_user(): now also copies utm_* from signup/anonymous-sign-in
-- metadata (see proxy.ts's signInAnonymously and the auth actions' signUp
-- calls) — 'direct' when none was ever captured, matching the column default
-- (this trigger always specifies every column explicitly, so the column
-- default itself never actually fires here — it's a defensive fallback for
-- any other insert path only).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    user_id, birth_year, department, is_expat, education_level, gender,
    utm_source, utm_medium, utm_campaign
  )
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'birth_year', '')::smallint,
    nullif(new.raw_user_meta_data->>'department', ''),
    coalesce((new.raw_user_meta_data->>'is_expat')::boolean, false),
    nullif(new.raw_user_meta_data->>'education_level', '')::public.education_level,
    nullif(new.raw_user_meta_data->>'gender', '')::public.gender,
    coalesce(nullif(new.raw_user_meta_data->>'utm_source', ''), 'direct'),
    coalesce(nullif(new.raw_user_meta_data->>'utm_medium', ''), 'direct'),
    coalesce(nullif(new.raw_user_meta_data->>'utm_campaign', ''), 'direct')
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- votes.utm_*: filled from the voter's own profile at insert time (so the
-- app never has to read-then-write it), then locked in place on any later
-- update (re-vote upserts the same row — see the votes migration's comment
-- on upsert-in-place with no history).
-- ---------------------------------------------------------------------------
create or replace function public.handle_vote_utm()
returns trigger
language plpgsql
as $$
declare
  voter_profile record;
begin
  if tg_op = 'INSERT' then
    select utm_source, utm_medium, utm_campaign into voter_profile
    from public.profiles where user_id = new.user_id;

    new.utm_source := coalesce(nullif(new.utm_source, ''), voter_profile.utm_source, 'direct');
    new.utm_medium := coalesce(nullif(new.utm_medium, ''), voter_profile.utm_medium, 'direct');
    new.utm_campaign := coalesce(nullif(new.utm_campaign, ''), voter_profile.utm_campaign, 'direct');
  elsif tg_op = 'UPDATE' then
    if old.utm_source is not null then new.utm_source := old.utm_source; end if;
    if old.utm_medium is not null then new.utm_medium := old.utm_medium; end if;
    if old.utm_campaign is not null then new.utm_campaign := old.utm_campaign; end if;
  end if;
  return new;
end;
$$;

create trigger votes_handle_utm
before insert or update on public.votes
for each row execute function public.handle_vote_utm();

-- Backfill: votes cast before this migration predate UTM tracking entirely —
-- 'direct' (not left null), so null in this column always means a tracking
-- bug going forward, never "this vote is older than the feature".
update public.votes set utm_source = 'direct', utm_medium = 'direct', utm_campaign = 'direct' where utm_source is null;

-- ---------------------------------------------------------------------------
-- Anonymous sessions (just introduced above) satisfy `auth.uid() = user_id`
-- just like a real account — RLS alone no longer distinguishes "logged in"
-- from "anonymous session with a UTM tag". The app layer already checks
-- `is_anonymous` (see lib/auth/session.ts's isRealUser, used everywhere a
-- vote/feedback/subject-proposal is written), but RLS is what's actually
-- enforced — tighten every write policy gated on "must be a real account" to
-- also reject an anonymous JWT, matching the belt-and-suspenders pattern
-- already used throughout this schema. `profiles` writes are deliberately
-- NOT restricted here — an anonymous session is meant to have its own
-- profile row (that's the whole point of the UTM-attribution flow).
-- ---------------------------------------------------------------------------
drop policy "Users can insert own vote" on public.votes;
create policy "Users can insert own vote" on public.votes for insert
  with check (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy "Users can update own vote" on public.votes;
create policy "Users can update own vote" on public.votes for update
  using (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy "Users can insert own feedback" on public.page_feedback;
create policy "Users can insert own feedback" on public.page_feedback for insert
  with check (auth.uid() = user_id and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy "Users can propose a subject" on public.subjects;
create policy "Users can propose a subject" on public.subjects for insert
  with check (
    source = 'user' and created_by = auth.uid() and status = 'pending'
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
