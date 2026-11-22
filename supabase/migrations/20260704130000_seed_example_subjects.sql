-- Example subjects to populate the platform while real content is authored
-- (9 subjects matching the homepage mockup: one headline impact and one
-- category each). Promoted from supabase/seed.sql to a migration so this
-- data also lands on the linked remote project, not just local dev.

with s as (
  insert into public.subjects (slug, title, description) values
    ('retraite-a-points-unique', 'Faut-il unifier les régimes de retraite ?',
     'Remplacer les 42 régimes actuels par un système universel à points, où chaque euro cotisé ouvrirait les mêmes droits pour tous.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 18.4, 'Md €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'econ';

with s as (
  insert into public.subjects (slug, title, description) values
    ('service-militaire-volontaire-universel', 'Instaurer un service militaire volontaire universel',
     'Un service de quatre mois, civil ou militaire au choix, ouvert à tous les jeunes de 18 à 25 ans sur la base du volontariat incité.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 2.8, 'Md €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'intl';

with s as (
  insert into public.subjects (slug, title, description) values
    ('encadrement-des-loyers', 'Étendre l''encadrement des loyers',
     'Généraliser à l''ensemble des zones tendues du territoire un dispositif aujourd''hui limité à quelques métropoles à titre expérimental.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 2.1, 'Md €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'econ';

with s as (
  insert into public.subjects (slug, title, description) values
    ('semaine-de-quatre-jours-fonction-publique', 'Expérimenter la semaine de quatre jours dans la fonction publique',
     'Un volume horaire hebdomadaire inchangé réparti sur quatre jours, testé pendant deux ans dans les administrations volontaires.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 1.2, 'Md €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'trav';

with s as (
  insert into public.subjects (slug, title, description) values
    ('peines-plancher-recidive', 'Rétablir des peines plancher pour la récidive',
     'Des peines minimales obligatoires en cas de récidive légale, avec possibilité pour le juge d''y déroger par une décision motivée.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 610, 'M €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'just';

with s as (
  insert into public.subjects (slug, title, description) values
    ('videosurveillance-algorithmique', 'Pérenniser la vidéosurveillance algorithmique',
     'Autoriser durablement la détection d''événements par caméras et algorithmes dans l''espace public, au-delà du cadre expérimental des Jeux olympiques.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 340, 'M €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'secu';

with s as (
  insert into public.subjects (slug, title, description) values
    ('uniforme-obligatoire-ecole-primaire', 'Rendre l''uniforme obligatoire à l''école primaire',
     'Une tenue unique dans les écoles publiques, avec une aide aux familles sous condition de ressources pour son financement.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 210, 'M €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'edu';

with s as (
  insert into public.subjects (slug, title, description) values
    ('aide-active-a-mourir', 'Créer un droit à l''aide active à mourir',
     'Ouvrir l''aide active à mourir aux personnes majeures atteintes d''une affection grave et incurable, sous conditions médicales strictes.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 90, 'M €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'sante';

with s as (
  insert into public.subjects (slug, title, description) values
    ('interdiction-jets-prives-vols-courts', 'Interdire les jets privés sur les vols courts',
     'Interdire les liaisons en jet privé lorsqu''une alternative en train de moins de 2h30 existe sur le même trajet.')
  returning id
), i as (
  insert into public.impacts (subject_id, title, value, unit, is_headline, display_order)
  select id, 'Impact budgétaire', 45, 'M €/an', true, 0 from s
  returning subject_id
)
insert into public.subject_categories (subject_id, category_id)
select s.id, c.id from s, public.categories c where c.slug = 'eco';
