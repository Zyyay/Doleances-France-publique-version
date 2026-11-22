-- Subjects ("sujets") core schema: title, description, categories (N-N), impacts (1-N).
-- Deliberately out of scope for now: arguments (pour/contre) and "clivant" (government
-- voting direction) — those get their own migration once that part of the product is designed.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- categories: fixed, curated list (the 8 ministry-style categories from the
-- homepage). display_order pins the order the frontend already uses to assign
-- each category its (colorblind-checked) color slot — keep it stable, never
-- reorder existing rows, only append.
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  display_order smallint not null unique
);

comment on table public.categories is 'Curated ministry-style categories a subject can be tagged with.';
comment on column public.categories.display_order is 'Fixed rank matching the frontend category color slot order — append-only.';

-- ---------------------------------------------------------------------------
-- subjects: the core "sujet" content — neutral title/description only.
-- Voting, arguments, and government-position comparison are handled elsewhere
-- and intentionally not modeled yet.
-- ---------------------------------------------------------------------------
create type public.subject_status as enum ('active', 'archived');

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  status public.subject_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subjects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

comment on column public.subjects.status is 'active = shown/votable on the platform, archived = kept but hidden from the public list.';

comment on table public.subjects is 'A société subject open for citizen consultation: neutral title + description.';

create index subjects_status_idx on public.subjects(status);

create trigger subjects_set_updated_at
before update on public.subjects
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subject_categories: a subject carries 1..N categories.
-- ---------------------------------------------------------------------------
create table public.subject_categories (
  subject_id uuid not null references public.subjects(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (subject_id, category_id)
);

create index subject_categories_category_id_idx on public.subject_categories(category_id);

comment on table public.subject_categories is 'Many-to-many link between subjects and categories.';

-- ---------------------------------------------------------------------------
-- impacts: a subject carries 1..N impact figures (e.g. "Impact budgétaire",
-- value 18.4, unit "Md €/an"). Exactly one per subject may be flagged as the
-- headline figure used for the homepage's default "importance sociétale" sort
-- and card display.
-- ---------------------------------------------------------------------------
create table public.impacts (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  value numeric not null,
  unit text not null,
  is_headline boolean not null default false,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.impacts is 'A single quantified impact figure attached to a subject (title + value + unit).';
comment on column public.impacts.is_headline is 'The one impact shown/sorted-on by default on the homepage card for this subject.';

create index impacts_subject_id_idx on public.impacts(subject_id);

-- at most one headline impact per subject
create unique index impacts_one_headline_per_subject
  on public.impacts(subject_id)
  where is_headline;

create trigger impacts_set_updated_at
before update on public.impacts
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — public read access everywhere (this is public
-- consultation content). Write policies are deferred until auth/admin roles
-- are designed; for now writes go through the service role only.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_categories enable row level security;
alter table public.impacts enable row level security;

create policy "Public can read categories" on public.categories for select using (true);
create policy "Public can read subjects" on public.subjects for select using (true);
create policy "Public can read subject_categories" on public.subject_categories for select using (true);
create policy "Public can read impacts" on public.impacts for select using (true);

-- ---------------------------------------------------------------------------
-- Reference data: the 8 categories already designed on the homepage mockup.
-- ---------------------------------------------------------------------------
insert into public.categories (slug, name, display_order) values
  ('econ', 'Économie & Finances', 1),
  ('secu', 'Intérieur & Sécurité', 2),
  ('just', 'Justice', 3),
  ('trav', 'Travail & Emploi', 4),
  ('sante', 'Santé & Solidarités', 5),
  ('intl', 'International & Défense', 6),
  ('edu', 'Éducation & Recherche', 7),
  ('eco', 'Écologie & Énergie', 8);
