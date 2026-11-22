-- Impacts were originally free-text units ("Md €/an", "M €/an", ...), which
-- can't be compared or summed across subjects. Every impact now carries a raw
-- (unscaled) value in exactly one of two units: euros or headcount.
alter table public.impacts
  add constraint impacts_unit_check check (unit in ('€', 'personnes'));

comment on column public.impacts.unit is 'Exactly one of: € (raw euro amount) or personnes (raw headcount) — never a scaled/free-text unit.';
comment on column public.impacts.value is 'Raw, unscaled figure in the row''s unit (e.g. 7740000000 for 7,74 Md€, not 7.74) — the frontend applies compact formatting for display.';
