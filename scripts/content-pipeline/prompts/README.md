# Prompts du pipeline éditorial

Ces fichiers sont les instructions exactes que Claude suit quand tu lui demandes
de générer du contenu ("génère les idées pour le sujet X"). Ils remplacent les
prompts qui étaient auparavant codés en dur dans des scripts appelant l'API
Anthropic facturée (supprimés).

**Format** : texte brut en français, avec des variables entre doubles accolades
(`{{comme_ceci}}`) que Claude remplace par les vraies valeurs (titre du sujet,
notes de recherche, etc.) avant de les utiliser. Modifie librement le texte
autour des variables — garde juste les noms de variables intacts.

Le pipeline s'exécute dans cet ordre : **Sujet → Idées → Arguments**, et
**Sondages**/**Décisions gouvernementales** en parallèle une fois le Sujet
approuvé. Chaque étape correspond à un script `insert*.ts` du même nom.

## Sujet — création (`insertSubject.ts`)

Le titre n'est pas découvert par la recherche : il vient d'une liste de sujets
choisis à l'avance, ou d'une proposition de visiteur (sujet `pending` en base).
Le flux est en deux étapes :

0. Proposition/validation du titre — échange direct dans le chat (pas de
   prompt dédié) : reformulation du titre brut en question de débat neutre et
   fermée si besoin, validée par toi avant de lancer la recherche.
1. [`subject-research.md`](./subject-research.md) — à partir du titre validé,
   recherche le contexte factuel, confirme (ou corrige) la catégorie, et
   trouve les chiffres d'impact.
2. [`subject-extract.md`](./subject-extract.md) — transformation en fiche
   sujet structurée (slug, synthèse, catégorie, impacts) autour du titre déjà
   validé.

## Idées (`insertIdeas.ts`)

3. [`ideas-research.md`](./ideas-research.md) — instructions pour la phase de
   recherche web (restreinte à la whitelist de `../config.ts`).
4. [`ideas-extract.md`](./ideas-extract.md) — instructions pour transformer
   les notes de recherche en liste d'idées structurée.

## Arguments (`insertArguments.ts`)

5. [`arguments-research.md`](./arguments-research.md) — recherche d'arguments
   et de sources pour une idée précise (déjà approuvée).
6. [`arguments-extract.md`](./arguments-extract.md) — transformation en
   arguments structurés avec sources.

## Sondages (`insertPolls.ts`)

7. [`polls-research.md`](./polls-research.md) — recherche de sondages
   d'opinion publiés par des instituts reconnus sur le sujet.
8. [`polls-extract.md`](./polls-extract.md) — transformation en sondages
   structurés (institut, date, question, % favorable, échantillon, source).

## Décisions gouvernementales (`insertDecisions.ts`)

9. [`decisions-research.md`](./decisions-research.md) — recherche des prises
   de décision du gouvernement sur le sujet, à différentes dates.
10. [`decisions-extract.md`](./decisions-extract.md) — transformation en
    décisions datées structurées (titre, constat, sens, source).

## Vérification (toutes les étapes)

11. [`verifier.md`](./verifier.md) — instructions données au sous-agent
    indépendant qui juge la neutralité/qualité du brouillon avant écriture en
    base. Ce sous-agent ne voit jamais les prompts de recherche/extraction ni
    la conversation qui a produit le brouillon — seulement ce fichier + le
    contenu à juger.

## Ce qui n'est PAS dans les prompts

Les limites de taille et la liste des sources autorisées sont dans
[`../config.ts`](../config.ts) et vérifiées **en code** par les scripts
`insert*.ts` correspondants, pas par instruction dans le prompt — un brouillon
qui dépasse une limite est rejeté même si le prompt disait de rester concis.
Si tu resserres/élargis une limite dans `config.ts`, pense à mettre à jour la
mention correspondante dans le fichier `*-extract.md` associé pour éviter
trop de brouillons rejetés après coup.
