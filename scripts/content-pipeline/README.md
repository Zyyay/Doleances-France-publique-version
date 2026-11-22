# Chaîne de création de contenu

Tout ce qu'on lit sur une page sujet (synthèse, sondages, décisions, idées, arguments) est produit ici, puis écrit dans la base Supabase. Le site ne fait que le lire.

## Le principe

Le contenu est rédigé par **Claude dans une conversation** (Claude Code), en suivant les prompts de [`prompts/`](prompts/). Aucune clé d'API payante n'est utilisée : les anciens scripts qui appelaient l'API Anthropic ont été retirés.

Chaque élément passe par quatre étapes :

1. **Recherche et rédaction.** Claude suit le prompt `*-research.md`, limité aux sources de la liste blanche, puis le prompt `*-extract.md`, qui produit un brouillon JSON.
2. **Relecture indépendante.** Un second agent, qui ne voit que [`prompts/verifier.md`](prompts/verifier.md) et le brouillon, juge sa neutralité et sa qualité.
3. **Insertion contrôlée.** Le script `insert*.ts` correspondant vérifie les règles dures, puis écrit le brouillon en base avec le statut `pending_review`, invisible sur le site.
4. **Validation humaine.** `npm run pipeline:review` liste ce qui attend, puis approuve ou rejette chaque ligne.

Les règles dures ne sont pas laissées au prompt : elles sont vérifiées en code, et un brouillon qui les enfreint est refusé.
- **Longueurs maximales** : `LENGTH_LIMITS` dans [`config.ts`](config.ts) ;
- **Sources autorisées** : `SOURCE_WHITELIST` dans le même fichier ;
- **Catégories et unités valides.**

## Ordre des étapes

```
Sujet ──► (validation) ──► Idées ──► Arguments (une idée à la fois)
     └──► Sondages
     └──► Décisions gouvernementales
```

Les idées ne peuvent être insérées que pour un sujet approuvé, et les arguments que pour une idée approuvée.

## Les scripts

À lancer depuis la racine du dépôt, avec `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`.

| Commande | Rôle |
|---|---|
| `npm run pipeline:insertSubject -- <brouillon.json>` | Crée un sujet, caché, avec ses chiffres d'impact, sa carte de partage et les options de vote Pour / Contre |
| `npm run pipeline:insertPolls -- <brouillon.json>` | Ajoute des sondages à un sujet |
| `npm run pipeline:insertDecisions -- <brouillon.json>` | Ajoute des décisions gouvernementales |
| `npm run pipeline:insertIdeas -- <brouillon.json>` | Ajoute des idées à un sujet approuvé |
| `npm run pipeline:insertArguments -- <brouillon.json>` | Ajoute les arguments d'une idée approuvée |
| `npm run pipeline:review -- list` | Liste le contenu en attente |
| `npm run pipeline:review -- approve <table> <id>` | Approuve une ligne ; pour la table `subjects`, publie le sujet |
| `npm run pipeline:review -- reject <table> <id>` | Rejette une ligne |
| `npm run pipeline:approveAllPending` | Approuve **tout** ce qui attend, dans toutes les tables : à réserver à un lot déjà relu |
| `npm run pipeline:cleanupOrphanedSubjectRows` | Repère, puis supprime avec `--apply`, les lignes rattachées à un sujet qui n'existe plus (simple rapport sans `--apply`) |
| `npx tsx scripts/content-pipeline/addCategory.ts <slug> <nom> [--apply]` | Ajoute une catégorie (simple rapport sans `--apply`). Il lui faut aussi une couleur et une icône côté site : voir l'en-tête du fichier |

Chaque script décrit en tête de fichier le format exact du JSON attendu.

## Les fichiers

| Chemin | Contenu |
|---|---|
| [`prompts/`](prompts/) | Les consignes données à Claude, une paire recherche / rédaction par type de contenu (voir [son README](prompts/README.md)) |
| [`examples/`](examples/) | Un jeu complet de brouillons réels, pour le sujet prisons |
| `drafts/` | Brouillons de travail, ignorés par git |
| [`config.ts`](config.ts) | Liste blanche des sources, longueurs maximales, catégories, unités |
| [`validators.ts`](validators.ts) | Vérifications partagées (longueurs, format des slugs) |
| [`supabaseAdmin.ts`](supabaseAdmin.ts) | Client Supabase avec la clé de service ; ne doit jamais être importé par le site |

## Règles éditoriales

- **Neutralité.** On décrit ce que mesurent les sources, sans qualifier une mesure. Les arguments présentent un bénéfice et ses limites.
- **Exactitude.** Les chiffres sont repris tels que publiés, avec leur source.
- **Carte de partage obligatoire.** Chaque sujet porte un chiffre court tiré de sa synthèse (`card_figure`) et sa légende (`card_label`). Ils s'affichent sur l'image de partage et au début des textes de partage après un vote. Le fait choisi illustre la tendance des sondages du sujet.
