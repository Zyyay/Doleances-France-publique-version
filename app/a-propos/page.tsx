import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "La démarche — Doléances",
  description: "Pourquoi et comment Doléances présente les sujets de société français : sources, méthodologie et équipe.",
};

export default function AProposPage() {
  return (
    <>
      <SiteNav />
      <header id="main-content" className={styles.hero}>
        <div className={styles.heroInner}>
          <h1 className={styles.title}>La démarche</h1>
          <p className={styles.subtitle}>
            Doléances est une plateforme citoyenne indépendante, sans objectif politique ou militant.
          </p>
        </div>
      </header>
      <div className={styles.wrap}>
        <section id="sources" className={styles.section}>
          <span className={styles.sectionEyebrow}>Démarche</span>
          <h2 className={styles.sectionTitle}>Sources de données</h2>
          <div className={styles.body}>
            <p>
              Les contenus sont restreints à un nombre limité de sources autorisées, choisies pour leur caractère
              officiel, indépendant ou méthodologiquement reconnu. Aucune source d&apos;opinion, de presse ou
              militante n&apos;est utilisée pour établir les faits présentés sur la plateforme.
            </p>
          </div>
          <div className={styles.sourceGrid}>
            <div className={styles.sourceCard}>
              <div className={styles.sourceCardTitle}>Faits — statistiques publiques officielles</div>
              <p className={styles.sourceCardHint}>
                Services statistiques ministériels et administrations publiques.
              </p>
              <div className={styles.sourceList}>
                <span>Insee, data.gouv.fr</span>
                <span>DREES (santé, solidarités)</span>
                <span>DARES (travail, emploi)</span>
                <span>DEPP (éducation)</span>
                <span>SDES (écologie, énergie)</span>
                <span>SSMSI (sécurité)</span>
                <span>SDSE (justice)</span>
                <span>Ministères de la Défense et de l&apos;Europe et des Affaires étrangères</span>
                <span>OCDE (comparaisons internationales)</span>
              </div>
            </div>
            <div className={styles.sourceCard}>
              <div className={styles.sourceCardTitle}>Évaluations — institutions de contrôle</div>
              <p className={styles.sourceCardHint}>
                Organismes chargés d&apos;évaluer l&apos;action publique de manière indépendante.
              </p>
              <div className={styles.sourceList}>
                <span>Cour des comptes</span>
                <span>France Stratégie</span>
                <span>Conseil d&apos;État</span>
                <span>Conseil constitutionnel</span>
                <span>Commissions d&apos;enquête de l&apos;Assemblée nationale et du Sénat</span>
                <span>IGAS (Inspection générale des affaires sociales)</span>
                <span>Haute Autorité de Santé</span>
                <span>Défenseur des droits</span>
              </div>
            </div>
            <div className={styles.sourceCard}>
              <div className={styles.sourceCardTitle}>Cadre légal et institutionnel</div>
              <p className={styles.sourceCardHint}>Textes de référence et sites institutionnels généraux.</p>
              <div className={styles.sourceList}>
                <span>Légifrance, vie-publique.fr, gouvernement.fr</span>
                <span>Écologie.gouv.fr, ADEME</span>
                <span>Conseil d&apos;orientation des retraites</span>
              </div>
            </div>
            <div className={styles.sourceCard}>
              <div className={styles.sourceCardTitle}>Sondages d&apos;opinion</div>
              <p className={styles.sourceCardHint}>Instituts reconnus, pour situer l&apos;opinion publique sur chaque sujet.</p>
              <div className={styles.sourceList}>
                <span>Ifop</span>
                <span>Elabe</span>
                <span>OpinionWay</span>
                <span>Ipsos</span>
                <span>Harris Interactive</span>
                <span>CSA</span>
                <span>Odoxa</span>
              </div>
            </div>
          </div>
        </section>

        <section id="methodologie" className={styles.section}>
          <span className={styles.sectionEyebrow}>Démarche</span>
          <h2 className={styles.sectionTitle}>Méthodologie</h2>
          <div className={styles.body}>
            <p>
              Chaque sujet de société est présenté en visant la plus grande neutralité possible : une synthèse
              factuelle, les principales idées qui structurent le débat, leurs arguments et sources, les sondages
              d&apos;opinion publiés par des instituts reconnus, et l&apos;historique des décisions gouvernementales
              sur le sujet.
            </p>
          </div>
          <div className={styles.stepList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepBody}>
                <strong>Question la plus neutre possible.</strong> Chaque sujet part d&apos;une question fermée et
                factuelle (« Faut-il... ? »), en évitant autant que possible toute formulation orientée.
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepBody}>
                <strong>Chiffres sourcés et interprétés.</strong> Chaque sujet retient le chiffre budgétaire le plus large et
                le plus réaliste disponible, et, si pertinent, la population directement concernée — toujours avec
                une source précise et une explication de ce que ce chiffre révèle concrètement pour la France.
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepBody}>
                <strong>Équilibre des points de vue.</strong> Les bénéfices potentiels et les limites ou coûts potentiels
                sont présentés avec le même niveau de nuance, sans qu&apos;aucune réponse à la question posée ne soit
                suggérée.
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <div className={styles.stepBody}>
                <strong>Relecture indépendante.</strong> Chaque fiche passe par une relecture avant publication, pour
                vérifier sa neutralité et son exactitude par rapport aux sources citées.
              </div>
            </div>
          </div>
          <p className={styles.body} style={{ marginTop: 20 }}>
            Chaque citoyen peut ensuite se positionner sur chaque sujet et comparer son avis à celui des autres
            votants ainsi qu&apos;aux positions prises par les pouvoirs publics.
          </p>
        </section>

        <section id="projet" className={styles.section}>
          <span className={styles.sectionEyebrow}>À propos</span>
          <h2 className={styles.sectionTitle}>À propos du projet</h2>
          <div className={styles.body}>
            <p>
              Doléances est né d&apos;un constat simple : il est difficile de se faire un avis informé sur les
              grands sujets de société français, entre commentaires orientés, chiffres sortis de leur contexte et
              débats polarisés. L&apos;objectif du projet est de donner à chaque citoyen une base factuelle commune —
              chiffres sourcés, arguments équilibrés, position des pouvoirs publics — pour se forger sa propre opinion,
              puis la comparer à celle des autres. Mais ce consensus ne pèse politiquement qu&apos;à la condition
              d&apos;être exprimé en nombre : seule une participation massive peut donner à ces positions citoyennes
              un poids susceptible d&apos;influencer les décisions publiques.
            </p>
          </div>
          <h3 className={styles.subSectionTitle}>L&apos;équipe</h3>
          <div className={styles.teamNote}>
            Doléances est porté par un petit collectif indépendant de citoyens, sans affiliation politique,
            partisane ou institutionnelle. Le projet n&apos;est financé par aucun parti, syndicat ou organisation
            militante.
          </div>
        </section>

        <section id="mentions-legales" className={styles.section}>
          <span className={styles.sectionEyebrow}>Informations légales</span>
          <h2 className={styles.sectionTitle}>Mentions légales</h2>
          <div className={styles.body}>
            <p>
              <strong>Éditeur.</strong>{" "}
              Doléances est édité à titre non professionnel par une personne physique. Conformément à
              l&apos;article 6-III-2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie
              numérique, son identité est communiquée à l&apos;hébergeur et tenue à la disposition de l&apos;autorité
              judiciaire.
            </p>
            <p>
              <strong>Hébergeur.</strong> Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
            </p>
          </div>
        </section>

        <section id="confidentialite" className={styles.section}>
          <span className={styles.sectionEyebrow}>Informations légales</span>
          <h2 className={styles.sectionTitle}>Politique de confidentialité</h2>
          <div className={styles.body}>
            <p>
              <strong>Responsable du traitement.</strong>{" "}
              Doléances, tel que précisé dans les mentions légales ci-dessus.
            </p>
            <p>
              <strong>Données collectées.</strong>{" "}
              À la création d&apos;un compte : adresse e-mail et mot de passe (jamais stocké en clair) — ou, si vous
              choisissez de vous inscrire via Google, l&apos;adresse e-mail et les informations de profil de base
              (nom, photo) transmises par Google. De façon facultative, à l&apos;inscription : année de naissance,
              département de résidence, niveau d&apos;étude, genre. Ensuite : l&apos;historique de vos votes sur les
              sujets, le contenu des retours que vous laissez le cas échéant sur une page, et le titre et le message
              des sujets que vous proposez, le cas échéant, via « Proposer un sujet ».
            </p>
            <p>
              <strong>Finalités.</strong>{" "}
              Créer et sécuriser votre compte ; rattacher votre vote à votre compte pour garantir un vote unique par
              personne et par sujet ; établir des statistiques agrégées à usage strictement interne (par exemple, la
              répartition des votes par tranche d&apos;âge). Ces données ne sont jamais vendues, louées, ni transmises
              à des tiers à des fins commerciales ou publicitaires.
            </p>
            <p>
              <strong>Base légale.</strong>{" "}
              La création de compte repose sur l&apos;exécution du service que vous demandez. Les champs
              démographiques (année de naissance, département, niveau d&apos;étude, genre) sont facultatifs et
              reposent sur votre consentement, donné librement au moment où vous choisissez de les renseigner.
            </p>
            <p>
              <strong>Cas particulier des votes, retours et propositions de sujet.</strong>{" "}
              Certains sujets de société peuvent, une fois votre position exprimée, laisser deviner une opinion
              politique — une catégorie de données que le RGPD encadre plus strictement (article 9). C&apos;est
              pourquoi votre premier vote, premier retour ou première proposition de sujet vous demande un
              consentement explicite et distinct, avant tout enregistrement. Ce consentement est libre, spécifique à
              ce traitement, et vous pouvez le retirer à tout moment en supprimant votre compte — ce qui efface
              également l&apos;historique concerné (voir « Durée de conservation »). Aucun vote ni commentaire
              individuel n&apos;est jamais visible sur le site, ni par les autres utilisateurs ni publiquement :
              seuls des résultats globaux et anonymisés sont affichés.
            </p>
            <p>
              <strong>Destinataires et sous-traitants.</strong>{" "}
              Vos données sont hébergées par Supabase Inc. (base de données et authentification, serveurs situés en
              Europe) et Vercel Inc. (hébergement du site) — toutes deux basées aux États-Unis, ce qui implique un
              transfert hors Union européenne encadré par des clauses contractuelles types. Si vous choisissez de vous
              connecter via Google, Google LLC intervient comme fournisseur d&apos;authentification, dans les mêmes
              conditions de transfert hors Union européenne. Aucun autre destinataire n&apos;a accès à vos données.
            </p>
            <p>
              <strong>Durée de conservation.</strong>{" "}
              Vos données sont conservées tant que votre compte existe. En cas de demande de suppression, elles sont
              effacées sous 30 jours maximum. Exception : si vous avez proposé un sujet, son titre et son message sont
              conservés au-delà de la suppression de votre compte (par exemple s&apos;il a depuis été publié comme
              sujet de vote), mais entièrement dissociés de votre identité — le lien vers votre compte est supprimé,
              pas le contenu proposé.
            </p>
            <p>
              <strong>Vos droits.</strong>{" "}
              Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
              de limitation et d&apos;opposition concernant vos données. Pour les exercer, écrivez à
              contact@doleances-france.fr. Vous disposez également du droit d&apos;introduire une réclamation auprès de
              la CNIL (cnil.fr).
            </p>
            <p>
              <strong>Cookies.</strong>{" "}
              Le site utilise uniquement des cookies de session strictement nécessaires à la connexion, exemptés de
              consentement. Aucun cookie de mesure d&apos;audience ni publicitaire n&apos;est utilisé à ce jour.
            </p>
            <p>
              <strong>Sécurité.</strong>{" "}
              L&apos;accès à vos données personnelles (profil, votes, retours, propositions de sujet) est restreint à
              vous seul au niveau de la base de données — aucun autre utilisateur ne peut y accéder.
            </p>
          </div>
        </section>

        <section id="contact" className={styles.section}>
          <span className={styles.sectionEyebrow}>Assistance</span>
          <h2 className={styles.sectionTitle}>Nous contacter</h2>
          <div className={styles.body}>
            <p>Une question, un signalement, une remarque sur un sujet ? Écrivez-nous.</p>
          </div>
          <a className={styles.contactButton} href="mailto:contact@doleances-france.fr">
            contact@doleances-france.fr
          </a>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
