"use client";

import { useRef, useState } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./ZfeIncomeChart.module.css";

/** Part propre (Crit'Air 1-2) vs polluante (Crit'Air 3-4-5 / non classé) du parc automobile, par tranche de revenu.
 * Chiffres publiés : 66 % de véhicules polluants chez les 20 % de ménages les plus modestes, 63 % de véhicules
 * propres chez les 20 % les plus aisés (Ministère de la Transition écologique). Le complément de chaque part
 * est dérivé par soustraction à 100 %, l'étude ne distinguant que ces deux catégories.
 * https://www.statistiques.developpement-durable.gouv.fr/quels-menages-possedent-des-voitures-critair-3-ou-plus-dans-les-metropoles-du-grand-paris-et-de */
const GROUPS = [
  { label: "20 % les plus modestes", propre: 34, polluant: 66 },
  { label: "20 % les plus aisés", propre: 63, polluant: 37 },
];

export function ZfeIncomeChart() {
  const width = 480;
  const height = 180;
  const marginLeft = 8;
  const marginRight = 8;
  const marginTop = 12;
  const marginBottom = 32;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const barWidth = 130;
  const gap = 2;
  const [hover, setHover] = useState<{ group: number; segment: "propre" | "polluant" } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const groupGap = plotWidth - barWidth * 2;
  const xFor = (i: number) => marginLeft + i * (barWidth + groupGap);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Composition du parc automobile par niveau de revenu</h3>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchPropre}`} /> Crit&apos;Air 1-2 (propre)
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchPolluant}`} /> Crit&apos;Air 3, 4, 5 ou non classé
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Chez les 20 % de ménages les plus modestes, 66 % des véhicules sont classés Crit'Air 3, 4, 5 ou non classés, contre 37 % chez les 20 % les plus aisés."
      >
        {GROUPS.map((group, i) => {
          const x = xFor(i);
          const propreHeight = (group.propre / 100) * plotHeight;
          const polluantHeight = (group.polluant / 100) * plotHeight - gap;
          const propreY = marginTop + plotHeight - propreHeight;
          const polluantY = propreY - gap - polluantHeight;
          const isPropreHover = hover?.group === i && hover.segment === "propre";
          const isPolluantHover = hover?.group === i && hover.segment === "polluant";

          return (
            <g key={group.label}>
              <g
                tabIndex={0}
                onPointerEnter={() => setHover({ group: i, segment: "polluant" })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ group: i, segment: "polluant" })}
                onBlur={() => setHover(null)}
                className={styles.interactiveGroup}
              >
                <rect x={x} y={polluantY} width={barWidth} height={polluantHeight} rx={4} className={isPolluantHover ? styles.polluantHover : styles.polluant} />
                <text x={x + barWidth / 2} y={polluantY + polluantHeight / 2 + 4} textAnchor="middle" className={styles.segmentLabel}>
                  {group.polluant} %
                </text>
              </g>
              <g
                tabIndex={0}
                onPointerEnter={() => setHover({ group: i, segment: "propre" })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ group: i, segment: "propre" })}
                onBlur={() => setHover(null)}
                className={styles.interactiveGroup}
              >
                <rect x={x} y={propreY} width={barWidth} height={propreHeight} rx={4} className={isPropreHover ? styles.propreHover : styles.propre} />
                {group.propre >= 12 && (
                  <text x={x + barWidth / 2} y={propreY + propreHeight / 2 + 4} textAnchor="middle" className={styles.segmentLabelLight}>
                    {group.propre} %
                  </text>
                )}
              </g>
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" className={styles.axisLabel}>
                {group.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className={styles.srOnly}>
        <caption>Composition du parc automobile par tranche de revenu (part de véhicules Crit&apos;Air)</caption>
        <thead>
          <tr>
            <th scope="col">Groupe</th>
            <th scope="col">Crit&apos;Air 1-2 (propre)</th>
            <th scope="col">Crit&apos;Air 3, 4, 5 ou non classé</th>
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((g) => (
            <tr key={g.label}>
              <td>{g.label}</td>
              <td>{g.propre} %</td>
              <td>{g.polluant} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
