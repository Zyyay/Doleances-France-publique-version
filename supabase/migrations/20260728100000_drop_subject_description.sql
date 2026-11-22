-- Removes subjects.description — it wasn't used anywhere on the frontend
-- (only ever read for the subject page's SEO meta description tag, which is
-- now omitted and falls back to the root layout's generic description).

alter table public.subjects
  drop column description;
