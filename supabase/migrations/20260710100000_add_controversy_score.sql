-- Controversy score backing the homepage "Les plus controversées" section.
-- Deliberately left null for every subject: the scoring mechanism (how it's
-- computed/assigned) isn't decided yet. Whatever assigns it later must
-- write into this column — the frontend only ever reads it, sorts subjects
-- that have a non-null score, and treats missing scores as "not ranked yet"
-- (not as 0/uncontroversial).

alter table public.subjects
  add column controversy_score smallint check (controversy_score between 0 and 100);

comment on column public.subjects.controversy_score is 'Indicative 0-100 controversy score, manually assigned (mechanism not yet defined) — null until scored. Higher = more controversial. Never derived from votes.';
