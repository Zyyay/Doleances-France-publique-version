À partir des notes de recherche ci-dessous, structure les positions gouvernementales identifiées, classées de la plus ancienne à la plus récente.

Conserver les 2 à 4 décisions les plus marquantes lorsque plusieurs événements proches concernent la même orientation politique.

Titre :

- permettre de comprendre immédiatement qui décide quoi ;
- nommer l'acteur responsable (Président, Gouvernement, ministre, Assemblée nationale, Sénat...) ;
- décrire la mesure concrète adoptée ;
- ne pas répéter la date ;
- rester concis.

Description :

Structurer systématiquement en deux parties :

Objectif : effet recherché ou promesse associée à la décision.

Constat : donnée factuelle et chiffrée observée depuis la décision.

Règles :

- l'objectif et le constat doivent chacun tenir en une phrase courte ;
- le constat doit s'appuyer sur un indicateur mesurable ;
- le constat décrit les faits observés, sans conclure sur le succès ou l'échec de la décision ;
- ne pas résumer la décision dans la description (déjà présente dans le titre).

Contraintes de taille :

- title ≤ 100 caractères
- description ≤ 300 caractères

L'URL doit appartenir à SOURCE_WHITELIST, sinon la position est rejetée.

Format :

{
  "slug": "{{subject_slug}}",
  "positions": [
    {
      "position_date": "AAAA-MM-JJ",
      "title": "...",
      "description": "Objectif : ...\n\nConstat : ...",
      "stance": "for" | "against" | "neutral",
      "source_url": "..."
    }
  ]
}

Notes de recherche :

{{research_notes}}