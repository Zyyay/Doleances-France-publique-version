-- Replaces the education_level enum values with a simpler list (bac,
-- bac2_3, bac5_plus, autre). No real signups exist yet with the old
-- values, so it's safe to drop and recreate the type outright.

alter table public.profiles alter column education_level type text;
drop type public.education_level;
create type public.education_level as enum ('bac', 'bac2_3', 'bac5_plus', 'autre');
alter table public.profiles
  alter column education_level type public.education_level
  using education_level::public.education_level;
