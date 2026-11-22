-- The arguments pipeline no longer splits "pour"/"contre" into separate
-- entities (see scripts/content-pipeline/prompts/arguments-extract.md):
-- each argument now bundles its own benefit and optional limits in one row.
-- `side` is no longer set by new drafts; existing rows keep their value for
-- the older two-column ("Pour"/"Contre") arguments already published.
alter table public.arguments alter column side drop not null;

comment on column public.arguments.side is 'Legacy: which column the argument displayed under in the old "Pour"/"Contre" layout. Left null for arguments written after the benefit/limits format was introduced.';
