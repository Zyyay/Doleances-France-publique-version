À partir des notes de recherche ci-dessous, structure la liste des sondages identifiés.

Contraintes de taille (dépassement = rejet automatique, voir config.ts) :
- Nom de l'institut : 80 caractères max
- Question : 160 caractères max (reformule de façon concise si l'intitulé exact est trop long, sans en trahir le sens)

L'URL de chaque sondage DOIT appartenir à la whitelist (config.ts — SOURCE_WHITELIST, section Sondages), sinon le sondage entier est rejeté.

Format de sortie attendu (JSON) :
{
  "slug": "{{subject_slug}}",
  "polls": [
    {
      "institute": "...",
      "conducted_on": "AAAA-MM-JJ",
      "question": "...",
      "favorable_pct": 0,
      "sample_size": 0,
      "source_url": "..."
    }
  ]
}

Notes de recherche :
{{research_notes}}
