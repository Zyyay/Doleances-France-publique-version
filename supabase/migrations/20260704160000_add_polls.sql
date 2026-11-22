-- Adds `polls`: 0..N external opinion polls per subject (IFOP, Elabe, ...),
-- distinct from the platform's own citizen vote (`results`).

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  institute text not null,
  conducted_on date not null,
  favorable_pct numeric not null check (favorable_pct >= 0 and favorable_pct <= 100),
  sample_size integer not null check (sample_size > 0),
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.polls is 'An external opinion poll (institute, date, % favorable, sample size) about a subject — not the platform''s own citizen vote.';

create index polls_subject_id_idx on public.polls(subject_id);

create trigger polls_set_updated_at
before update on public.polls
for each row execute function public.set_updated_at();

alter table public.polls enable row level security;

create policy "Public can read polls" on public.polls for select using (true);

-- ---------------------------------------------------------------------------
-- Representative demo data (retraite-a-points-unique only — every other
-- subject stays at 0 polls, representing "no poll published yet").
-- ---------------------------------------------------------------------------
insert into public.polls (subject_id, institute, conducted_on, favorable_pct, sample_size)
select id, v.institute, v.conducted_on::date, v.favorable_pct, v.sample_size
from public.subjects,
  (values
    ('IFOP', '2022-03-01', 58, 1004),
    ('Elabe', '2023-01-01', 51, 1500),
    ('OpinionWay', '2024-09-01', 49, 2003),
    ('IFOP', '2025-05-01', 54, 1200)
  ) as v(institute, conducted_on, favorable_pct, sample_size)
where slug = 'retraite-a-points-unique';
