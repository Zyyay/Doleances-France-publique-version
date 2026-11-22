-- Representative demo data for the new concepts (ideas, arguments + sources,
-- synthesis, results, government positions), covering the 0/1/N shapes:
--   - retraite-a-points-unique: 2 ideas, a multi-source argument, 5 results
--     (the nuanced scale), a 5-entry government timeline
--   - interdiction-jets-prives-vols-courts: 1 idea, 2 results (plain
--     pour/contre — N isn't fixed at 5), a single "for" government position
--   - all other subjects: left at 0 ideas / 0 results / 0 government
--     positions, and an empty synthesis, to represent the "nothing written
--     yet" case.

-- ---------------------------------------------------------------------------
-- Synthesis
-- ---------------------------------------------------------------------------
update public.subjects set synthesis =
  'La France compte aujourd''hui 42 régimes de retraite distincts, chacun avec ses propres règles de cotisation, d''âge de départ et de calcul des pensions. Un système universel à points remplacerait cette organisation par un régime unique, où chaque euro cotisé ouvrirait des droits identiques pour tous les actifs, quel que soit leur statut ou leur secteur.

Ce projet avait été porté entre 2019 et 2020 avant d''être suspendu, puis remplacé par une réforme portant sur l''âge de départ (2023). La question de l''unification des régimes reste ouverte et fait l''objet de nouveaux travaux depuis 2024.'
where slug = 'retraite-a-points-unique';

update public.subjects set synthesis =
  'Les vols en jet privé sont questionnés pour leur empreinte carbone par passager, nettement supérieure à celle des vols commerciaux ou du train sur une distance équivalente. La mesure envisagée viserait spécifiquement les liaisons pour lesquelles une alternative ferroviaire de moins de 2h30 existe déjà, sans interdire l''aviation d''affaires dans son ensemble.'
where slug = 'interdiction-jets-prives-vols-courts';

-- ---------------------------------------------------------------------------
-- retraite-a-points-unique — idea 1: fusionner les régimes spéciaux
-- ---------------------------------------------------------------------------
with idea as (
  insert into public.ideas (subject_id, title, description, display_order)
  select id, 'Fusionner les régimes spéciaux dans le régime général',
         'Intégrer progressivement les régimes spéciaux existants dans le régime général de retraite.', 1
  from public.subjects where slug = 'retraite-a-points-unique'
  returning id
), arg_for as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'for', 'Fin des écarts de règles',
         'Elle mettrait fin aux écarts de règles entre régimes spéciaux et régime général, aujourd''hui perçus comme peu lisibles par les assurés.', 1
  from idea
  returning id
), arg_against as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'against', 'Pénibilité non prise en compte',
         'Certains régimes spéciaux compensent des conditions de travail spécifiques (pénibilité, horaires atypiques) qu''un système unique pourrait ne pas prendre en compte.', 2
  from idea
  returning id
), src_for as (
  insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
  select arg_for.id, 'Rapport annuel — convergence des régimes', 'Conseil d''orientation des retraites (COR)', '2024-01-01', 1
  from arg_for
  returning id
)
insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
select arg_against.id, 'Pour un système universel de retraite', 'Rapport Delevoye', '2019-01-01', 1
from arg_against;

-- ---------------------------------------------------------------------------
-- retraite-a-points-unique — idea 2: système universel à points
-- (the "for" argument carries two sources, to represent the 1..N case)
-- ---------------------------------------------------------------------------
with idea as (
  insert into public.ideas (subject_id, title, description, display_order)
  select id, 'Adopter un système universel à points',
         'Remplacer le calcul des pensions par un système de points où chaque euro cotisé ouvre les mêmes droits.', 2
  from public.subjects where slug = 'retraite-a-points-unique'
  returning id
), arg_for as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'for', 'Portabilité des droits',
         'Un système à points simplifierait la portabilité des droits entre secteurs public et privé, en particulier pour les actifs qui changent de statut en cours de carrière.', 1
  from idea
  returning id
), arg_against as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'against', 'Une transition longue et incertaine',
         'La transition vers un système unique nécessiterait une période de convergence pouvant dépasser 15 ans, selon les estimations du COR.', 2
  from idea
  returning id
), src_for_1 as (
  insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
  select arg_for.id, 'Rapport annuel sur les retraites', 'Cour des comptes', '2023-01-01', 1
  from arg_for
  returning id
), src_for_2 as (
  insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
  select arg_for.id, 'Étude sur les coûts de gestion des régimes de retraite', 'IGAS', '2022-01-01', 2
  from arg_for
  returning id
)
insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
select arg_against.id, 'Note sur la trajectoire de convergence des régimes', 'Conseil d''orientation des retraites (COR)', '2024-06-01', 1
from arg_against;

-- ---------------------------------------------------------------------------
-- retraite-a-points-unique — results (nuanced 5-point scale)
-- ---------------------------------------------------------------------------
insert into public.results (subject_id, label, leaning, vote_count, display_order)
select id, v.label, v.leaning, v.vote_count, v.display_order
from public.subjects,
  (values
    ('Tout à fait contre', -2, 25686, 1),
    ('Plutôt contre', -1, 26970, 2),
    ('Sans opinion', 0, 15412, 3),
    ('Plutôt pour', 1, 32108, 4),
    ('Tout à fait pour', 2, 28254, 5)
  ) as v(label, leaning, vote_count, display_order)
where slug = 'retraite-a-points-unique';

-- ---------------------------------------------------------------------------
-- retraite-a-points-unique — government position timeline
-- ---------------------------------------------------------------------------
insert into public.government_positions (subject_id, position_date, title, description, stance, display_order)
select id, v.position_date::date, v.title, v.description, v.stance::public.government_position_stance, v.display_order
from public.subjects,
  (values
    ('2021-06-01', 'Aucune réforme structurelle engagée', 'Aucune réforme structurelle des régimes n''a été engagée cette année.', 'neutral', 1),
    ('2022-09-01', 'Annonce d''une consultation', 'Annonce d''une consultation sur l''unification des régimes.', 'neutral', 2),
    ('2023-04-01', 'Réforme de l''âge de départ votée', 'La réforme de l''âge de départ est votée ; l''unification des régimes n''est pas retenue.', 'against', 3),
    ('2024-11-01', 'Rapport commandé au COR', 'Un rapport est commandé au Conseil d''orientation des retraites sur la faisabilité d''un régime universel.', 'neutral', 4),
    ('2025-03-01', 'Maintien des régimes actuels', 'Position officielle : maintien des régimes actuels, réformes ciblées privilégiées à la fusion.', 'against', 5)
  ) as v(position_date, title, description, stance, display_order)
where slug = 'retraite-a-points-unique';

-- ---------------------------------------------------------------------------
-- interdiction-jets-prives-vols-courts — idea, arguments, results, position
-- ---------------------------------------------------------------------------
with idea as (
  insert into public.ideas (subject_id, title, description, display_order)
  select id, 'Interdire les vols en jet privé sur les liaisons desservies par le train en moins de 2h30',
         'Cible spécifiquement les trajets pour lesquels une alternative ferroviaire rapide existe déjà.', 1
  from public.subjects where slug = 'interdiction-jets-prives-vols-courts'
  returning id
), arg_for as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'for', 'Une alternative bas-carbone déjà disponible',
         'Sur ces liaisons, le train permet de couvrir le même trajet en un temps comparable avec une empreinte carbone très inférieure.', 1
  from idea
  returning id
), arg_against as (
  insert into public.arguments (idea_id, side, title, description, display_order)
  select idea.id, 'against', 'Un effet limité sur les émissions globales',
         'Les vols en jet privé ne représentent qu''une fraction marginale des émissions totales du secteur aérien français.', 2
  from idea
  returning id
), src_for as (
  insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
  select arg_for.id, 'Note sur les émissions du transport aérien d''affaires', 'ADEME', '2023-05-01', 1
  from arg_for
  returning id
)
insert into public.argument_sources (argument_id, title, publisher, published_on, display_order)
select arg_against.id, 'Bilan carbone de l''aviation d''affaires', 'DGAC', '2022-10-01', 1
from arg_against;

insert into public.results (subject_id, label, leaning, vote_count, display_order)
select id, v.label, v.leaning, v.vote_count, v.display_order
from public.subjects,
  (values
    ('Contre', -1, 17147, 1),
    ('Pour', 1, 41981, 2)
  ) as v(label, leaning, vote_count, display_order)
where slug = 'interdiction-jets-prives-vols-courts';

insert into public.government_positions (subject_id, position_date, title, description, stance, display_order)
select id, '2025-02-01'::date, 'Soutien à une interdiction ciblée',
       'Le gouvernement se déclare favorable à une interdiction des vols en jet privé sur les liaisons où une alternative ferroviaire rapide existe.',
       'for'::public.government_position_stance, 1
from public.subjects where slug = 'interdiction-jets-prives-vols-courts';
