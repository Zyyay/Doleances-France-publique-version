# Exemples de brouillons

Un jeu complet de brouillons pour un même sujet (prisons), tel qu'il a été
inséré en base. Chaque fichier est l'entrée d'un script `insert*.ts` :

| Fichier | Script | Remarque |
|---|---|---|
| `subject.json` | `npm run pipeline:insertSubject -- <fichier>` | Fiche du sujet : titre, synthèse, catégorie, carte de partage, chiffres d'impact. |
| `polls.json` | `npm run pipeline:insertPolls -- <fichier>` | Sondages, rattachés au sujet par son `slug`. |
| `decisions.json` | `npm run pipeline:insertDecisions -- <fichier>` | Décisions gouvernementales datées. |
| `ideas.json` | `npm run pipeline:insertIdeas -- <fichier>` | Propositions à débattre. |
| `arguments.json` | `npm run pipeline:insertArguments -- <fichier>` | Arguments d'**une** idée, rattachés par son `ideaId` (l'identifiant de l'idée en base, connu une fois `ideas.json` inséré). |

Ces fichiers servent de référence de format. Les relancer échouerait : le sujet
existe déjà, et les scripts refusent les doublons.

Les vrais brouillons de travail vont dans `../drafts/`, que git ignore : une
fois le contenu inséré et validé, c'est la base qui fait foi.
