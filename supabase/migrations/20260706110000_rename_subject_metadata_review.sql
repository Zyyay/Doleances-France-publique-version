-- Renames subjects.synthesis_review_status to metadata_review_status: this
-- gate now covers the whole AI-generated subject record (title, description,
-- synthesis, category) produced by the new "Sujet" pipeline stage, not just
-- the synthesis text.

alter table public.subjects rename column synthesis_review_status to metadata_review_status;

comment on column public.subjects.metadata_review_status is 'Review gate for the subject''s own AI-generated metadata (title, description, synthesis, category) — independent from ideas/arguments/polls/government_positions review.';
