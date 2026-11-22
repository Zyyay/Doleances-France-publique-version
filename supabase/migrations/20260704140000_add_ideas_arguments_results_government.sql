-- Adds: ideas (0..N per subject), arguments (1 per idea, "for"/"against" side)
-- with 1..N sources each, a synthesis field on subjects, results (0..N per
-- subject), and government positions (0..N per subject, over time).

-- ---------------------------------------------------------------------------
-- subjects: add the longer neutral write-up shown in "Présentation
-- synthétique" (distinct from the short hero `description`).
-- ---------------------------------------------------------------------------
alter table public.subjects add column synthesis text not null default '';
comment on column public.subjects.synthesis is 'Longer neutral write-up for the "Présentation synthétique" section, as opposed to the short hero description.';

-- ---------------------------------------------------------------------------
-- ideas: a subject breaks down into 0..N concrete ideas/proposals. Arguments
-- attach to an idea, not directly to the subject.
-- ---------------------------------------------------------------------------
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.ideas is 'A concrete proposal belonging to a subject. A subject can have 0..N ideas.';

create index ideas_subject_id_idx on public.ideas(subject_id);

create trigger ideas_set_updated_at
before update on public.ideas
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- arguments: exactly one idea per argument. `side` is an internal key, not
-- the final user-facing wording (that copy is still TBD — see comment).
-- ---------------------------------------------------------------------------
create type public.argument_side as enum ('for', 'against');

create table public.arguments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas(id) on delete cascade,
  side public.argument_side not null,
  title text not null,
  description text not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.arguments is 'A factual argument attached to exactly one idea.';
comment on column public.arguments.side is 'Which column the argument displays under. Internal key only — the public-facing label for "for"/"against" is not finalized.';

create index arguments_idea_id_idx on public.arguments(idea_id);

create trigger arguments_set_updated_at
before update on public.arguments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- argument_sources: an argument cites 1..N sources.
-- ---------------------------------------------------------------------------
create table public.argument_sources (
  id uuid primary key default gen_random_uuid(),
  argument_id uuid not null references public.arguments(id) on delete cascade,
  title text not null,
  publisher text,
  url text,
  published_on date,
  display_order smallint not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.argument_sources is 'A reference cited by an argument. An argument should have at least one.';

create index argument_sources_argument_id_idx on public.argument_sources(argument_id);

-- ---------------------------------------------------------------------------
-- results: 0..N aggregated tallies per subject, one row per response option
-- (e.g. "Tout à fait pour", "Sans opinion", ...). `leaning` is a proposed
-- addition: a signed rank (negative = "contre" side, 0 = neutral, positive =
-- "pour" side) so the frontend can color/order a diverging bar from data
-- alone, without parsing free-text labels or hardcoding a fixed option count.
-- ---------------------------------------------------------------------------
create table public.results (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  label text not null,
  leaning smallint not null default 0,
  vote_count integer not null default 0 check (vote_count >= 0),
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, label)
);

comment on table public.results is 'One aggregated tally per response option for a subject (0..N rows — the number and wording of options is not fixed).';
comment on column public.results.leaning is 'Signed rank on the contre(-)..pour(+) spectrum, 0 = neutral. Drives diverging-bar color/order.';

create index results_subject_id_idx on public.results(subject_id);

create trigger results_set_updated_at
before update on public.results
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- government_positions: 0..N dated entries per subject tracking how the
-- government's stance evolved over time.
-- ---------------------------------------------------------------------------
create type public.government_position_stance as enum ('for', 'against', 'neutral');

create table public.government_positions (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  position_date date not null,
  title text not null,
  description text not null,
  stance public.government_position_stance not null,
  display_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.government_positions is 'A dated entry describing the government''s stance on a subject at a point in time.';

create index government_positions_subject_id_idx on public.government_positions(subject_id);

create trigger government_positions_set_updated_at
before update on public.government_positions
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — same pattern as the rest of the schema: public read, writes deferred.
-- ---------------------------------------------------------------------------
alter table public.ideas enable row level security;
alter table public.arguments enable row level security;
alter table public.argument_sources enable row level security;
alter table public.results enable row level security;
alter table public.government_positions enable row level security;

create policy "Public can read ideas" on public.ideas for select using (true);
create policy "Public can read arguments" on public.arguments for select using (true);
create policy "Public can read argument_sources" on public.argument_sources for select using (true);
create policy "Public can read results" on public.results for select using (true);
create policy "Public can read government_positions" on public.government_positions for select using (true);
