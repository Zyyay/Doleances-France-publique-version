-- The share card (app/sujets/[slug]/opengraph-image.tsx) leads with one short
-- fact taken from the subject's synthesis, chosen to illustrate the trend of
-- its polls. Free text rather than impacts.value/unit: facts like "6 sur 7"
-- or "1974" are not a quantity in € or personnes.

alter table public.subjects add column card_figure text;
alter table public.subjects add column card_label text;

comment on column public.subjects.card_figure is 'Big figure on the share card (e.g. "142 %"), taken from the synthesis. Null: the card shows the title alone.';
comment on column public.subjects.card_label is 'One-line caption under card_figure on the share card.';

update public.subjects as s
set card_figure = v.figure, card_label = v.label
from (values
  ('prisons-faut-il-construire-plus-de-places-et-faire-cesser-drogue-telephones-et-loisirs-non-autorises-en-detention', '142 %', 'd''occupation : 90 020 détenus pour 63 348 places'),
  ('mettre-en-place-des-dispositifs-pour-garantir-l-expulsion-effective-des-etrangers-en-situation-irreguliere', '6 sur 7', 'OQTF restent sans effet'),
  ('augmenter-peines-trafic-de-drogue-et-moyens-demantelement-reseaux', '10 000', 'mineurs recrutés comme guetteurs ou dealers'),
  ('faut-il-reformer-les-regles-agricoles-pour-revaloriser-le-metier-d-agriculteur', '−40 %', 'de revenu agricole en trente ans (pouvoir d''achat)'),
  ('faut-il-reformer-l-attribution-et-le-controle-des-logements-sociaux-en-france', '2,767 millions', 'de ménages en attente d''un logement social'),
  ('faut-il-reduire-les-delais-et-augmenter-les-poursuites-contre-la-corruption-d-elus', '14,4 ans', 'de procédure pour un élu, contre 9 mois en moyenne'),
  ('faut-il-instaurer-un-referendum-d-initiative-citoyenne', '0', 'référendum d''initiative partagée abouti depuis 2015'),
  ('interdire-constitutionnellement-le-vote-d-un-budget-en-deficit', '1974', 'dernier budget voté à l''équilibre'),
  ('pour-les-soins-non-urgents-faut-il-exiger-un-paiement-avant-de-soigner-les-personnes-non-assurees', '1,386 Md€', 'de dépenses d''aide médicale d''État en 2024'),
  ('conditionner-les-aides-publiques-aux-entreprises-au-maintien-de-l-emploi-en-france', '211 Md€', 'd''aides en 2023, que l''État peine à évaluer'),
  ('faut-il-donner-aux-citoyens-le-droit-de-revoquer-un-elu-en-exercice', '28', 'États américains permettent de révoquer un élu'),
  ('faut-il-relever-le-niveau-d-exigence-des-examens-bac-brevet-meme-si-cela-fait-baisser-le-taux-de-reussite', '91,4 %', 'de réussite au bac en 2024, contre 75 % en 1995'),
  ('faut-il-renforcer-le-droit-de-legitime-defense-du-citoyen', '7 sur 10', 'cambriolages ont lieu de jour, hors légitime défense présumée'),
  ('faut-il-reserver-le-pass-culture-au-patrimoine-plutot-qu-a-des-industries-culturelles-deja-rentables', '1 %', 'des dépenses du Pass Culture vont aux musées'),
  ('attractivite-metier-enseignant', '3 185', 'postes d''enseignants non pourvus en 2024'),
  ('faut-il-faire-plus-pour-l-emploi-des-seniors-en-france', '90 ans', 'pour récupérer ses cotisations en reprenant un emploi à 64 ans'),
  ('faut-il-maintenir-les-interdictions-zones-a-faibles-emissions-zfe-aux-vehicules-anciens-en-ville', '2 sur 45', 'agglomérations interdisent vraiment les Crit''Air 3'),
  ('maintenir-souverainete-francaise-de-la-dissuasion-nucleaire', '8', 'pays européens s''entraînent avec nos forces nucléaires'),
  ('faut-il-reduire-le-budget-de-l-aide-publique-au-developpement-de-la-france', '0,50 %', 'du revenu national, contre 0,36 % en moyenne OCDE')
) as v(slug, figure, label)
where s.slug = v.slug;
