-- Category-level context metadata: budget weight and a long-run public-trust
-- indicator, shown on the homepage category filter and at the top of subject
-- pages. These are order-of-magnitude estimates derived from published LFI
-- 2024 mission-level credits (budget général de l'État, ~492 Md€) and general
-- public-trust survey trends (e.g. Cevipof baromètre de la confiance
-- politique) — illustrative context, not individually sourced/reviewed the
-- way subject content is (see scripts/content-pipeline). Refine in place if
-- better figures are available; no history is kept.

alter table public.categories
  add column budget_eur numeric,
  add column budget_pct_state numeric(5, 2),
  add column trust_score smallint check (trust_score between 1 and 100);

comment on column public.categories.budget_eur is 'Approximate annual weight in euros (raw, unscaled) of this policy area in the French state budget (budget général de l''État, LFI 2024 mission credits).';
comment on column public.categories.budget_pct_state is 'budget_eur as a percentage of the total French state budget (~492 Md€, LFI 2024).';
comment on column public.categories.trust_score is 'Indicative 1-100 score of public confidence in policies led in this area over the last 30 years (higher = more confidence). Rendered as an emoji/mini-graph on the frontend, never as a raw number.';

update public.categories set budget_eur = 15000000000, budget_pct_state = 3.00, trust_score = 32 where slug = 'econ';
update public.categories set budget_eur = 24000000000, budget_pct_state = 4.90, trust_score = 45 where slug = 'secu';
update public.categories set budget_eur = 11000000000, budget_pct_state = 2.20, trust_score = 38 where slug = 'just';
update public.categories set budget_eur = 21500000000, budget_pct_state = 4.40, trust_score = 40 where slug = 'trav';
update public.categories set budget_eur = 33000000000, budget_pct_state = 6.70, trust_score = 58 where slug = 'sante';
update public.categories set budget_eur = 59000000000, budget_pct_state = 12.00, trust_score = 62 where slug = 'intl';
update public.categories set budget_eur = 95000000000, budget_pct_state = 19.30, trust_score = 48 where slug = 'edu';
update public.categories set budget_eur = 22500000000, budget_pct_state = 4.60, trust_score = 41 where slug = 'eco';
