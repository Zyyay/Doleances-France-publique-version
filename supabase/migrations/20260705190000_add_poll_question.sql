-- Adds the exact (or faithfully reworded) question text behind each poll, so
-- the frontend can show what was actually asked instead of implying every
-- poll answers the subject's own headline question verbatim.

alter table public.polls add column question text not null default '';

comment on column public.polls.question is 'The poll question, verbatim or faithfully reworded — shown as the clickable label linking to source_url.';
