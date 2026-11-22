À partir des notes de recherche ci-dessous, extrais les idées ou propositions concrètes identifiées.

Impact chiffré retenu pour le sujet : {{subject_impact_title}} — {{subject_impact_value}} {{subject_impact_unit}}

Chaque idée doit :

- être formulée comme un gain concret pour la France ;
- faire comprendre le bénéfice final obtenu ;
- être spécifique et non générale ;
- rester neutre politiquement ;
- être distincte des autres idées ;
- se rattacher sans ambiguïté à l'une des deux réponses (Pour ou Contre) à la question fermée du sujet — critère non négociable, le vote citoyen final est strictement binaire. Si les notes de recherche ne permettent pas de trancher cette ambiguïté pour une idée candidate, ne l'extrais pas.

Règles de rédaction :

- Une idée = un seul bénéfice principal.
- Utiliser des termes concrets plutôt qu'abstraits.
- Remplacer autant que possible les objectifs intermédiaires par leur effet final sur les Français.
- Si un chiffre est cité, privilégier sa conséquence plutôt que le chiffre lui-même.
- Éviter les formulations défensives lorsqu'un bénéfice positif équivalent existe.
- Éviter les slogans, promesses vagues et effets de communication.

Règles pour l'impact chiffré de chaque idée :

- `impact_value` est obligatoire : trouver un chiffre sourcé et circonscrit spécifiquement au périmètre de cette idée. Dans le doute, omettre l'idée si elle n'est pas sourcée elle n'est pas au milieu du débat publique.
- `impact_value` est obligatoirement dans la même unité que l'impact du sujet ({{subject_impact_unit}}) — ne jamais convertir vers une autre unité.
- `impact_value` est un nombre brut, non mis à l'échelle (mêmes règles que pour les impacts de sujet) : la valeur la plus grande et la plus réaliste trouvée dans les notes de recherche pour ce périmètre précis.
- `impact_value` est essentielle pour garder ou jeter une idée. Si <15% de l'impact € derrière l'idée à mettre de côté.

Contraintes :

- title ≤ 160 caractères
- description ≤ 200 caractères

Format :

{
  "slug": "{{subject_slug}}",
  "ideas": [
    {
      "title": "...",
      "description": "...",
      "impact_value": 1800000000
    }
  ]
}

Notes de recherche :

{{research_notes}}