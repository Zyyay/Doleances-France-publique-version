-- An idea's own impact figure, in the same unit as its subject's headline
-- impact (see impacts.unit / impacts_unit_check) — the unit itself isn't
-- stored here since it's always inherited from the subject, never chosen
-- independently. Nullable: not every idea has a distinctly-scoped, reliably
-- sourced figure worth citing at its own level.
alter table public.ideas add column impact_value numeric;

alter table public.ideas
  add constraint ideas_impact_value_positive check (impact_value is null or impact_value > 0);

comment on column public.ideas.impact_value is 'Raw (unscaled) figure in the parent subject''s headline impact unit — null when no distinctly-scoped, sourced figure exists for this idea specifically.';
