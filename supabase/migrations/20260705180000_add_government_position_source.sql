-- Adds a source_url to government_positions, matching the same provenance
-- requirement as polls.source_url — every AI-assisted position entry must be
-- traceable to a whitelisted source (see scripts/content-pipeline/config.ts).

alter table public.government_positions add column source_url text;

comment on column public.government_positions.source_url is 'Source backing this dated position entry (declaration, vote, decree...). Nullable for pre-existing hand-authored rows.';
