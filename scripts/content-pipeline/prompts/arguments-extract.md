À partir des notes de recherche ci-dessous, produis les principaux arguments identifiés en faveur de l'idée, ainsi que leurs éventuelles limites associées.

Chaque argument doit représenter un mécanisme ou bénéfice distinct.

Format obligatoire pour chaque argument :

Titre :
- court et percutant ;
- décrire le bénéfice principal ou son impact concret ;
- éviter les formulations vagues ;
- usage interne uniquement (visible en base et dans review.ts) — le frontend n'affiche plus ce titre publiquement.

Description :

Structure obligatoire :

Bénéfice : ...

Limites :
- ...
- ...
- ...

Le frontend retire le label "Bénéfice : " et affiche chaque ligne de "Limites :" avec son propre badge — jamais le texte brut "Bénéfice :"/"Limites :". Écris donc chaque phrase (le bénéfice, chaque limite) comme une phrase autonome et déjà correctement capitalisée, capable d'être lue et affichée seule une fois le label retiré.

Règles :

- le bénéfice doit être concret et compréhensible pour un citoyen ;
- relier explicitement les chiffres à leur conséquence réelle ;
- ne pas citer un chiffre sans expliquer ce qu'il signifie ;
- conserver uniquement les informations les plus utiles à la compréhension ;
- les limites sont facultatives ;
- 0 à 3 limites maximum ;
- chaque limite doit être réellement distincte ;
- une limite peut être un coût, une contrainte, un risque, une incertitude ou une condition de réussite ;
- rester factuel et neutre ;
- éviter tout slogan ou argument militant.

Montants :

Si un montant dépasse 100 M€, le rendre concret par une comparaison avec l'un des domaines suivants :
- éducation ;
- santé ;
- sécurité.

Sources :

- chaque argument doit posséder au moins une source ;
- conserver les sources les plus fiables et les plus récentes ;
- toute URL hors SOURCE_WHITELIST entraîne le rejet de l'argument.

Contraintes :

- title ≤ 80 caractères
- description ≤ 300 caractères
- source.title ≤ 80 caractères

Format de sortie :

{
  "ideaId": "{{idea_id}}",
  "arguments": [
    {
      "title": "...",
      "description": "Bénéfice : ...\n\nLimites :\n- ...\n- ...",
      "sources": [
        {
          "title": "...",
          "url": "...",
          "publisher": "..."
        }
      ]
    }
  ]
}

Notes de recherche :

{{research_notes}}