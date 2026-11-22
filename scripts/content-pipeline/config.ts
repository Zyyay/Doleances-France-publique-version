/**
 * Content pipeline configuration: source whitelist and text length limits.
 *
 * Keep this in sync with scripts/content-pipeline/prompts/*.md — the prompts
 * mention these same numbers so drafts don't get rejected after the fact.
 */

export const SOURCE_WHITELIST: string[] = [
  // --- Faits (non interprétés) : statistiques publiques officielles ---
  "insee.fr",
  "data.gouv.fr",
  "solidarites-sante.gouv.fr", // couvre la DREES (santé/solidarités)
  "travail-emploi.gouv.fr", // couvre la DARES (travail/emploi)
  "education.gouv.fr", // couvre la DEPP (éducation)
  "enseignementsup-recherche.gouv.fr", // recherche/enseignement supérieur
  "developpement-durable.gouv.fr", // couvre le SDES (écologie/énergie)
  "agriculture.gouv.fr", // couvre l'Agreste (agriculture) — inclut les sous-domaines DRAAF
  "interieur.gouv.fr", // couvre le SSMSI (sécurité)
  "justice.gouv.fr", // couvre le SDSE (justice)
  "defense.gouv.fr",
  "diplomatie.gouv.fr", // affaires étrangères

  // --- Évaluations : institutions de contrôle et d'évaluation ---
  "ccomptes.fr", // Cour des comptes
  "strategie.gouv.fr", // France Stratégie
  "conseil-etat.fr", // Conseil d'État
  "conseil-constitutionnel.fr", // Conseil constitutionnel
  "assemblee-nationale.fr", // commissions d'enquête parlementaires
  "senat.fr", // commissions d'enquête parlementaires
  "igas.gouv.fr", // Inspection générale des affaires sociales
  "has-sante.fr", // Haute Autorité de Santé

  // --- Cadre légal / institutionnel général ---
  "vie-publique.fr",
  "gouvernement.fr",
  "legifrance.gouv.fr",
  "ecologie.gouv.fr",
  "ademe.fr",
  "cor-retraites.fr", // Conseil d'orientation des retraites

  // --- Précédents étrangers officiels (au cas par cas, pour des comparaisons
  //     internationales précises citées dans les arguments/idées) ---
  "dhs.gov", // U.S. Department of Homeland Security

  // --- Sondages ---
  "ifop.com",
  "elabe.fr",
  "opinion-way.com",
  "ipsos.com",
  "harris-interactive.fr",
  "csa.eu", // Institut CSA
  // Commanditaire, pas institut : CSA ne publie pas durablement tous ses
  // sondages commandés (rapports non indexés/non trouvables au-delà de
  // quelques mois) — l'article du commanditaire est alors la source publique
  // de référence pour ce sondage précis. N'ajouter un autre média d'actualité
  // ici qu'au cas par cas, pas par défaut.
  "europe1.fr",

  // --- Dérogations validées au cas par cas (sujet prisons) ---
  "ofdt.fr", // Observatoire français des drogues et des tendances addictives (enquête ESSPRI)
  "lyoncapitale.fr", // seule source publique du chiffre de 80 000 portables saisis en prison en 2024
];

/**
 * Couverture par catégorie (voir components/CategoryBadge.tsx pour la liste) —
 * à vérifier à nouveau si tu ajoutes une catégorie ou renommes un ministère :
 *   econ    (Économie & Finances)        -> insee.fr, ccomptes.fr, strategie.gouv.fr
 *   secu    (Intérieur & Sécurité)       -> interieur.gouv.fr, ccomptes.fr, conseil-etat.fr
 *   just    (Justice)                    -> justice.gouv.fr, conseil-etat.fr, legifrance.gouv.fr
 *   trav    (Travail & Emploi)           -> travail-emploi.gouv.fr, insee.fr, strategie.gouv.fr
 *   sante   (Santé & Solidarités)        -> solidarites-sante.gouv.fr, has-sante.fr, igas.gouv.fr
 *   intl    (International & Défense)   -> defense.gouv.fr, diplomatie.gouv.fr, ccomptes.fr
 *   edu     (Éducation & Recherche)      -> education.gouv.fr, enseignementsup-recherche.gouv.fr, strategie.gouv.fr
 *   eco     (Écologie & Agriculture)     -> ecologie.gouv.fr, developpement-durable.gouv.fr, ademe.fr, agriculture.gouv.fr
 *   culture (Culture)                    -> (pas encore de domaine dédié whitelisté)
 *   soc     (Société & Démographie)      -> insee.fr, solidarites-sante.gouv.fr, strategie.gouv.fr
 */

/** The 10 ministry-style categories — see components/CategoryBadge.tsx for the matching icons/colors. */
export const CATEGORY_SLUGS = [
  "econ",
  "secu",
  "just",
  "trav",
  "sante",
  "intl",
  "edu",
  "eco",
  "culture",
  "soc",
] as const;

/**
 * The only two units an impact figure may carry — kept deliberately narrow so
 * every subject's impacts sit on one of two comparable scales (raw euros, raw
 * headcount), never a free-text unit like "Md €/an" that can't be compared
 * across subjects.
 */
export const IMPACT_UNITS = ["€", "personnes"] as const;

export const LENGTH_LIMITS = {
  subjectTitle: 200,
  subjectSynthesis: 800,
  impactTitle: 80,
  ideaTitle: 160,
  ideaDescription: 200,
  argumentTitle: 80,
  argumentDescription: 300,
  sourceTitle: 80,
  pollInstitute: 80,
  pollQuestion: 160,
  governmentPositionTitle: 100,
  governmentPositionDescription: 300,
  /** Share card (app/sujets/[slug]/opengraph-image.tsx): the big figure, then its one-line caption. */
  cardFigure: 16,
  cardLabel: 62,
} as const;

/** Domain match is suffix-based so "www.insee.fr" and "bdm.insee.fr" both match "insee.fr". */
export function isWhitelistedUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  return SOURCE_WHITELIST.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
