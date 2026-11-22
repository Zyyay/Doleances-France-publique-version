-- Adds `profiles`: one row per authenticated user, holding the optional
-- demographic signals collected at signup (année de naissance, département,
-- niveau d'étude, sexe). All fields are nullable/optional by design — never
-- required to use the platform. Unlike every other table in this schema,
-- profiles are private: a user can only see/edit their own row.

create type public.gender as enum ('homme', 'femme');
create type public.education_level as enum ('college', 'cap_bep', 'bac', 'bac2', 'bac3', 'bac5_plus', 'doctorat');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  birth_year smallint check (birth_year is null or (birth_year between 1900 and 2100)),
  department text,
  is_expat boolean not null default false,
  education_level public.education_level,
  gender public.gender,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Private per-user profile: optional self-reported demographic signals only, never required.';
comment on column public.profiles.department is 'French département code (e.g. "75"), or null when is_expat is true.';
comment on column public.profiles.is_expat is 'True for French citizens living abroad — department does not apply.';

alter table public.profiles enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = user_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row the moment a user signs up, reading whatever
-- optional fields were passed in as signup metadata (see lib/auth's signup
-- Server Action). Runs as security definer so it can insert regardless of
-- RLS/session state — needed because a freshly-created (possibly
-- unconfirmed) user has no active session yet to satisfy the RLS policies
-- above. Google sign-ins don't carry these fields, so their row starts
-- blank and gets filled in later via the "compléter mon profil" step.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, birth_year, department, is_expat, education_level, gender)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'birth_year', '')::smallint,
    nullif(new.raw_user_meta_data->>'department', ''),
    coalesce((new.raw_user_meta_data->>'is_expat')::boolean, false),
    nullif(new.raw_user_meta_data->>'education_level', '')::public.education_level,
    nullif(new.raw_user_meta_data->>'gender', '')::public.gender
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
