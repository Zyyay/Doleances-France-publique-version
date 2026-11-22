-- Adds a review/validation gate for AI-generated content. Existing
-- hand-authored rows default to 'approved' (nothing changes for them);
-- the content pipeline will insert new rows as 'pending_review' and a human
-- flips them to 'approved' or 'rejected'. Public queries only ever read
-- 'approved' rows for these tables.

create type public.review_status as enum ('pending_review', 'approved', 'rejected');

alter table public.subjects add column synthesis_review_status public.review_status not null default 'approved';
comment on column public.subjects.synthesis_review_status is 'Review state of the `synthesis` field specifically (not the whole subject row).';

alter table public.ideas add column review_status public.review_status not null default 'approved';
alter table public.arguments add column review_status public.review_status not null default 'approved';
alter table public.impacts add column review_status public.review_status not null default 'approved';
alter table public.polls add column review_status public.review_status not null default 'approved';
alter table public.government_positions add column review_status public.review_status not null default 'approved';

create index ideas_review_status_idx on public.ideas(review_status);
create index arguments_review_status_idx on public.arguments(review_status);
create index impacts_review_status_idx on public.impacts(review_status);
create index polls_review_status_idx on public.polls(review_status);
create index government_positions_review_status_idx on public.government_positions(review_status);
