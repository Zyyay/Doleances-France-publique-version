Titre déjà validé (ne pas le reformuler ni en proposer un autre — le reprendre tel quel) : "{{title}}"

À partir de ce titre et des notes de recherche ci-dessous, rédige la fiche d'identité neutre du sujet :

- Slug : identifiant d'URL dérivé du titre ci-dessus, en minuscules, mots séparés par des tirets, sans accents ni ponctuation.
- Synthèse : 2 à 4 paragraphes courts et neutres présentant les principaux gains et pertes potentiels ou observés pour la France concernant ce sujet. La synthèse doit également situer la France par rapport aux pays les plus pertinents sur le sujet.
- Catégorie : un seul slug parmi econ, secu, just, trav, sante, intl, edu, eco.
- Impacts : 1 à 2 chiffres clés quantifiant l'enjeu (voir règles dédiées ci-dessous).

Règles pour les impacts :

- Toujours exactement un impact d'unité "€" : le chiffre budgétaire (coût, budget ou manque à gagner) le plus large et le plus réaliste trouvé dans les notes de recherche — pas une estimation basse ou partielle par prudence, mais le chiffre le plus complet et le mieux sourcé disponible (ex. un coût agrégé toutes missions plutôt qu'un seul poste de dépense, s'il est sourcé).
- Un second impact d'unité "personnes" est optionnel : uniquement si les notes de recherche font ressortir clairement une population directement concernée par le sujet (pas nécessairement des citoyens français), avec le même principe de valeur la plus grande et la plus réaliste.
- Aucune autre unité n'est autorisée. Ne jamais utiliser un multiple textuel ("Md", "M", "k") ni de suffixe temporel ("/an") dans le champ `unit` : `unit` vaut littéralement "€" ou "personnes".
- `value` est le nombre brut, non mis à l'échelle, dans cette unité (ex. 7740000000 pour 7,74 milliards d'euros, pas 7.74 ; 6000000 pour 6 millions de personnes, pas 6). Le frontend se charge de la mise en forme compacte à l'affichage.
- Marque exactement un impact avec `is_headline: true` : celui qui représente le mieux l'enjeu du sujet (en général l'impact en €, sauf si l'impact en personnes est manifestement plus parlant pour ce sujet précis).
- `title` : un court label du chiffre (ex. "Coût annuel de la politique d'immigration, d'asile et d'intégration"), pas une phrase.

Règle essentielle :

Ne jamais citer un chiffre, un événement ou une décision sans expliquer ce qu'il révèle sur la situation française.

Chaque information retenue doit répondre implicitement à ces questions :

- que mesure-t-elle réellement ?
- pourquoi est-elle importante ?
- quelle conséquence concrète pour la France en découle ?

Après chaque fait, répondre mentalement à : "Et alors ?".

Si aucune conséquence concrète, aucun impact ou aucun enseignement ne peut être formulé, ne pas retenir ce fait dans la synthèse.

Privilégier les indicateurs de résultat, d'impact, de coût ou d'efficacité plutôt que les simples indicateurs d'activité administrative.

Règles de rédaction :

- Ne cite pas un chiffre agrégé sans en tirer la conséquence concrète (gain ou perte).
- Distingue les sous-populations pertinentes lorsque le sujet l'exige (ex. immigration de travail, familiale, étudiante, asile ; régulier vs irrégulier).
- Présente avec le même niveau de nuance les bénéfices potentiels et les limites ou coûts potentiels.
- Va au bout du raisonnement : un fait ne doit jamais être laissé sans interprétation.
- Un chiffre isolé est insuffisant ; il doit être accompagné d'un contexte permettant de comprendre s'il est élevé, faible, en hausse, en baisse ou atypique.

Pour chaque donnée importante, fournir au moins un élément de contexte parmi :

- évolution dans le temps ;
- comparaison internationale ;
- part du total concerné ;
- impact budgétaire ;
- impact concret sur les citoyens ;
- impact sur les services publics ;
- impact économique.

Éviter les indicateurs de simple activité lorsqu'ils n'apportent pas d'information sur un résultat réel.

Exemples à éviter :

- "6 700 refus d'entrée ont été prononcés."
- "192 140 interpellations ont eu lieu."

Exemples préférables :

- "6 700 refus d'entrée ont été prononcés. Cela montre que plusieurs milliers de tentatives d'entrée non autorisées sont bloquées chaque mois, sans permettre à lui seul d'évaluer l'efficacité globale du contrôle des frontières."
- "192 140 interpellations ont été réalisées. Cela traduit un niveau élevé d'activité des services de contrôle mais ne permet pas, à lui seul, de mesurer l'évolution réelle de l'immigration irrégulière."

Précision et rigueur :

- N'utilise jamais un chiffre sensible (sécurité, nationalité, origine...) en mélangeant des mesures incompatibles ou sans le contexte méthodologique indispensable.
- Si ce contexte ne tient pas dans le format, préfère ne pas utiliser le chiffre.
- Si tu cites une contribution économique ou fiscale d'une sous-population, précise sa nature lorsque la source le permet et explique ce que cela implique concrètement.
- Si le sujet porte sur un contrôle ou une politique d'application (sécurité, fraude, immigration...), ne l'évalue pas uniquement à travers ses indicateurs d'échec ou de rattrapage ; cherche également les indicateurs décrivant le fonctionnement normal du système.
- Lors d'une comparaison internationale, explicite toujours ce que la différence observée implique concrètement pour la France.
- Ne déduis jamais un impact agrégé à partir d'un simple écart moyen si la donnée d'impact global n'existe pas.

Montants :

- Dès qu'un montant dépasse 100 millions d'euros, le rendre concret par une comparaison avec l'un des domaines suivants : éducation, santé ou sécurité.

Priorité des informations :

1. résultats observés ;
2. conséquences pour les Français ;
3. coûts ou gains pour les finances publiques ;
4. comparaisons internationales ;
5. évolutions historiques ;
6. activité administrative.

Contraintes de taille :

- Synthèse : 800 caractères max
- Titre d'impact : 80 caractères max
- Chiffre de la carte de partage : 16 caractères max
- Libellé de la carte de partage : 62 caractères max (au-delà de 56, il est affiché en plus petit)

Carte de partage (obligatoire) — c'est l'image qui s'affiche quand on partage le
lien du sujet sur un réseau social, et le début des textes de partage après un
vote :

- `card_figure` : un chiffre court et frappant **repris de la synthèse**
  (ex. « 142 % », « 6 sur 7 », « 1974 ») ;
- `card_label` : une ligne qui complète le chiffre (ex. « OQTF restent sans
  effet ») ;
- le fait choisi illustre la **tendance de l'opinion** sur le sujet (les
  sondages repérés pendant la recherche) ; il reste neutre et ne cible jamais
  une entreprise nommée. Le sujet est créé avant ses sondages : une fois
  ceux-ci insérés, vérifier que le fait colle toujours à leur tendance.

Format de sortie attendu (JSON) — `title` reprend exactement le titre validé fourni ci-dessus :

{
  "slug": "...",
  "title": "...",
  "synthesis": "...",
  "category": "...",
  "card_figure": "...",
  "card_label": "...",
  "impacts": [
    { "title": "...", "value": 7740000000, "unit": "€", "is_headline": true },
    { "title": "...", "value": 6000000, "unit": "personnes", "is_headline": false }
  ]
}

Notes de recherche :

{{research_notes}}