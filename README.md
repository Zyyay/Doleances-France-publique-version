# Doléances

**Doléances** ([doleances-france.fr](https://doleances-france.fr)) est une plateforme citoyenne indépendante. Elle part des sujets de société sur lesquels les Français sont déjà largement d'accord selon les sondages, présente chaque sujet de façon factuelle et sourcée, et invite chacun à voter Pour ou Contre.

Chaque sujet est une question fermée (« Faut-il… ? »), accompagnée de :

- une **synthèse** courte et chiffrée, parfois illustrée d'un graphique ;
- les **sondages** d'instituts reconnus sur la question ;
- les **décisions gouvernementales** passées, sur une frise ;
- des **idées** concrètes, chacune avec ses arguments (bénéfice et limites) et leurs sources ;
- le **vote** des visiteurs, dont les résultats s'affichent après avoir voté.

Le projet est terminé et n'est plus développé activement. Ce dépôt est publié tel quel pour que chacun puisse comprendre comment il fonctionne, le réutiliser ou s'en inspirer.

## Sommaire

- [Fonctionnalités et état d'avancement](#fonctionnalités-et-état-davancement)
- [Architecture](#architecture)
- [Carte du dépôt](#carte-du-dépôt)
- [Lancer le projet](#lancer-le-projet)
- [Créer du contenu](#créer-du-contenu)
- [Base de données](#base-de-données)
- [Limites connues](#limites-connues)
- [Autres documents](#autres-documents)
- [Licence](#licence)

## Fonctionnalités et état d'avancement

### Terminées et en production

| Fonctionnalité | Où regarder |
|---|---|
| Page d'accueil : filtre par catégorie, classements des sujets les plus votés et les plus tranchés, sujets déjà votés relégués en fin de liste | `app/page.tsx`, `components/SubjectBoard.tsx` |
| Page sujet : synthèse, sondages, frise des décisions, idées et arguments sourcés | `app/sujets/[slug]/page.tsx` |
| Graphiques sur mesure pour certains sujets (prisons, bac, ZFE, agriculture…) | `app/sujets/[slug]/*Chart.tsx`, branchés par slug dans `page.tsx` |
| Vote Pour / Contre, modifiable, résultats visibles après le vote | `app/sujets/[slug]/VoteCard.tsx`, `actions.ts` |
| Vote express : les sujets défilent en cartes, on vote d'un glissement | `app/vote-express/` |
| Comptes : e-mail et mot de passe, ou Google ; retour à la page d'origine après connexion | `app/(auth)/`, `lib/auth/nextPath.ts` |
| Profil facultatif (année de naissance, département, diplôme…) | `app/(auth)/completer-profil/`, `app/compte/` |
| Consentement explicite (RGPD, article 9) avant le premier vote : un vote peut révéler une opinion politique | `lib/auth/consent.ts` |
| Protection : captcha Cloudflare Turnstile, e-mails jetables refusés, limitation du nombre de requêtes | `components/auth/useTurnstile.tsx`, `lib/auth/email.ts`, `lib/rateLimit.ts` |
| Proposer un sujet (enregistré comme sujet `pending`, invisible jusqu'à modération) | `components/ProposeSubjectButton.tsx`, `app/actions.ts` |
| Retour sur une page sujet (« Donnez votre avis sur la page ») | `app/sujets/[slug]/FeedbackButton.tsx` |
| Image de partage par sujet : un chiffre clé, le titre, le drapeau | `app/sujets/[slug]/opengraph-image.tsx` |
| Partage après un vote : menu natif sur téléphone ; WhatsApp, X et copie du lien sur ordinateur | `components/SubjectShareActions.tsx`, `lib/shareTexts.ts` |
| Page d'invitation, cible du partage en fin de vote express | `app/invitation/` |
| Attribution des votes et inscriptions à leur source (liens UTM venant de X, Threads, Reddit) | `proxy.ts`, `lib/utm.ts` |
| Suivi des erreurs (Sentry) et mesure d'audience (Vercel Analytics) | `instrumentation*.ts`, `sentry.*.config.ts`, `components/analytics.tsx` |
| Chaîne de création de contenu assistée par IA, avec relecture humaine obligatoire | `scripts/content-pipeline/` |

### En sommeil : codées mais désactivées

| Fonctionnalité | État | Pour la réactiver |
|---|---|---|
| Vérification de l'adresse e-mail avant de voter | Désactivée depuis le 24/10/2026 pour qu'un nouveau compte puisse voter tout de suite. Le code (fenêtres de confirmation, renvoi de l'e-mail) est en place et la base garde la trace des adresses vérifiées (`profiles.email_verified`). | Passer `EMAIL_VERIFICATION_REQUIRED` à `true` dans `lib/auth/featureFlags.ts` **et** activer « Confirm email » dans Supabase (voir le commentaire du fichier). |
| Connexion Google | Active. | `GOOGLE_AUTH_ENABLED` dans le même fichier permet de masquer les boutons sans toucher à la configuration. |

### À moitié faites

- **Retour au sujet après confirmation de l'e-mail.** Après connexion, on revient bien au sujet d'où l'on venait, mais pas en cliquant sur le lien de confirmation reçu par e-mail. Sans effet tant que la vérification est en sommeil.
- **Données en base, jamais affichées :**
  - le score de confiance par catégorie (`categories.trust_score`) ;
  - le score de controverse des sujets (`subjects.controversy_score`, jamais rempli) ;
  - le chiffre d'impact rattaché à une idée (`ideas.impact_value`) ;
  - les chiffres d'impact d'un sujet (table `impacts`), affichés seulement dans les scripts de contenu.
- **Poids budgétaire des catégories.** Il est affiché (anneau sur l'accueil et en haut des pages sujets), mais ce sont des ordres de grandeur estimés, pas des chiffres sourcés un par un (voir la migration `20260709110000_add_category_metadata.sql`).
- **Attribution des partages.** Les liens partagés après un vote ne portent pas encore de marqueur UTM : on ne sait pas combien de votes viennent des partages. Il faudrait ajouter les sources (`whatsapp`, `partage`…) à la liste blanche de `lib/utm.ts` et aux contraintes de la migration `20260902100000_add_utm_attribution.sql`.

### Jamais faites

- **Mot de passe oublié.** Aucun parcours de réinitialisation ; aujourd'hui il faut écrire à l'adresse de contact.
- **Suppression de compte en libre-service.** Elle se fait sur demande par e-mail, comme l'indique la politique de confidentialité (`app/a-propos/`).
- **Back-office.** La modération des propositions de sujets, la lecture des retours et la relecture du contenu se font dans le tableau de bord Supabase ou avec les scripts de `scripts/content-pipeline/`.

## Architecture

- **[Next.js](https://nextjs.org) 16** (App Router, Server Components, Server Actions), déployé sur **Vercel** depuis la branche `main`.
- **[Supabase](https://supabase.com)** : base PostgreSQL et authentification. Le site ne lit et n'écrit qu'avec la clé publique ; les droits sont appliqués par les règles RLS (Row Level Security) de chaque table. Seuls les scripts de contenu utilisent la clé de service, en local.
- **Contenu en base, pas dans le code.** Sujets, synthèses, idées, arguments, sondages et décisions vivent dans Supabase. Le site les lit avec un cache de 60 secondes (`lib/subjects.ts`).
- **Relecture obligatoire.** Tout contenu produit par la chaîne éditoriale entre en base avec le statut `pending_review` et reste invisible tant qu'un humain ne l'a pas approuvé.

```
Visiteur ──► Next.js (Vercel) ──► Supabase (clé publique + RLS)
                                      ▲
Éditeur ──► Claude + prompts ──► brouillons JSON ──► scripts insert*.ts (clé de service) ──► relecture ──► publication
```

## Carte du dépôt

```
app/                      Pages et routes (App Router)
  page.tsx                  Accueil
  sujets/[slug]/            Page sujet : vote, graphiques, image de partage, actions serveur
  vote-express/             Vote express
  (auth)/                   Inscription, connexion, complétion du profil, actions d'authentification
  compte/                   Mon compte
  invitation/               Page d'arrivée des liens partagés depuis le vote express
  a-propos/                 À propos, mentions légales et politique de confidentialité
  actions.ts                Proposer un sujet
components/               Composants partagés (navigation, cartes, partage, popins)
  auth/                     Formulaires et boutons d'authentification
lib/                      Logique hors interface
  subjects.ts               Lecture du contenu en base (avec cache)
  shareTexts.ts             Textes de partage après un vote
  auth/                     Session, consentement, e-mails, interrupteurs de fonctionnalités
  supabase/                 Clients Supabase (navigateur, serveur) et constantes publiques
  rateLimit.ts, utm.ts      Limitation des requêtes, attribution UTM
proxy.ts                  Rafraîchit la session et capte les paramètres UTM à chaque requête
scripts/content-pipeline/ Création du contenu éditorial (voir son README)
supabase/migrations/      Schéma de la base, migration par migration
assets/fonts/             Polices embarquées dans les images de partage
DESIGN.md                 Choix visuels non évidents (palette, mise en page)
AGENTS.md, CLAUDE.md      Consignes pour les assistants de code IA travaillant sur le dépôt
```

## Lancer le projet

Prérequis : Node.js 20 ou plus récent, et un projet Supabase.

```bash
npm install
npm run dev        # http://localhost:3000
```

L'URL et la clé publique du projet Supabase sont écrites dans `lib/supabase/config.ts` : pour utiliser votre propre projet, remplacez-les, puis appliquez les migrations (voir [Base de données](#base-de-données)).

Les autres réglages passent par un fichier `.env.local`, jamais commité :

| Variable | Utilité | Sans elle |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service, **secrète**, utilisée seulement par les scripts de contenu | Les scripts refusent de démarrer |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Limitation des requêtes sur le vote, l'inscription, la connexion et les retours ([Upstash](https://upstash.com)) | Aucune limite (avertissement en production) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Captcha Cloudflare Turnstile sur l'inscription et la connexion | Pas de captcha |
| `NEXT_PUBLIC_SENTRY_DSN` | Suivi des erreurs ([Sentry](https://sentry.io)) | Rien n'est envoyé |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | Envoi des source maps à Sentry pendant le build | Traces d'erreur sur du code minifié |
| `NEXT_PUBLIC_SITE_URL` | Domaine canonique (aperçus de liens, plan du site, liens partagés) | `https://doleances-france.fr` |

La clé secrète de Turnstile, l'identifiant Google OAuth et les réglages d'e-mail se configurent dans le tableau de bord Supabase (Authentication), pas dans le code.

## Créer du contenu

Tout le contenu du site est produit par une chaîne éditoriale décrite dans [`scripts/content-pipeline/README.md`](scripts/content-pipeline/README.md). En résumé :

1. Les fichiers de [`scripts/content-pipeline/prompts/`](scripts/content-pipeline/prompts/) sont les consignes données à Claude pour rechercher les faits et rédiger chaque élément : sujet, idées, arguments, sondages, décisions.
2. Claude produit un brouillon JSON, qu'un second agent indépendant relit pour en vérifier la neutralité.
3. Un script `npm run pipeline:insert…` vérifie les règles dures (longueurs, sources autorisées, format) et insère le brouillon en base, invisible.
4. Un humain relit et approuve avec `npm run pipeline:review`.

## Base de données

Le schéma est entièrement décrit par les fichiers de `supabase/migrations/`, à appliquer **dans l'ordre de leur nom**. En production, ils ont été collés un par un dans le SQL Editor de Supabase ; `supabase db push` (CLI Supabase) fait la même chose sur un projet lié. Chaque fichier commence par un commentaire qui explique pourquoi il existe.

Tables principales :

| Table | Contenu | Lecture publique |
|---|---|---|
| `subjects` | Sujets : titre, synthèse, carte de partage, statut (`active`, `archived`, `pending`) | Sujets actifs seulement |
| `categories`, `subject_categories` | Catégories et rattachement des sujets | Oui |
| `impacts`, `ideas`, `arguments`, `argument_sources`, `polls`, `government_positions` | Contenu éditorial d'un sujet, chaque ligne avec son statut de relecture | Oui, filtré sur `approved` par le site |
| `results` | Options de vote d'un sujet et leur compteur | Oui |
| `votes` | Un vote par personne et par sujet | Chacun ne voit que le sien |
| `profiles` | Profil facultatif, consentement, source d'arrivée | Chacun ne voit que le sien |
| `page_feedback` | Retours laissés sur les pages | Chacun ne voit que les siens |

## Limites connues

- **Brouillons lisibles avant validation.** Les lignes de contenu encore en `pending_review` sont filtrées par le site, mais la règle RLS de lecture de ces tables est ouverte (`using (true)`) : quelqu'un qui interroge l'API Supabase directement peut les lire. Ce n'est que du contenu éditorial ; il suffirait d'ajouter `review_status = 'approved'` à ces règles.
- **Graphiques codés à la main.** Chaque graphique est un composant écrit pour un sujet précis, avec ses données dans le code, et branché par slug dans `app/sujets/[slug]/page.tsx`. Changer le slug d'un sujet le détache de son graphique.
- **Version de Next.js récente.** Next.js 16 diffère des versions précédentes sur plusieurs points (par exemple `proxy.ts` remplace `middleware.ts`). La documentation de la version installée est dans `node_modules/next/dist/docs/`.

## Autres documents

- [`scripts/content-pipeline/README.md`](scripts/content-pipeline/README.md) : la chaîne de création de contenu, ses scripts et ses règles.
- [`scripts/content-pipeline/prompts/README.md`](scripts/content-pipeline/prompts/README.md) : le rôle de chaque prompt.
- [`DESIGN.md`](DESIGN.md) : les choix visuels qui ne se devinent pas en lisant le CSS.

## Licence

Copyright (C) 2026 Zyyay.

Ce programme est un logiciel libre, distribué sous la licence [GNU Affero General Public License](LICENSE), version 3 ou toute version ultérieure. Vous pouvez le réutiliser, le modifier et le redistribuer. Si vous faites tourner une version modifiée du site et la rendez accessible à d'autres personnes, vous devez aussi leur donner accès à son code source.

Le contenu éditorial (synthèses, idées, arguments) vit dans la base de données, pas dans ce dépôt ; seuls les exemples de `scripts/content-pipeline/examples/` y figurent.
