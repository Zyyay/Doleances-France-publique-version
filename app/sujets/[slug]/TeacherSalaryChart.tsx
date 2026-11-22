"use client";

import { useRef, useState } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./TeacherSalaryChart.module.css";

/** Salaire des enseignants du collège, converti en USD selon les parités de pouvoir d'achat
 * (PPA) — donc déjà corrigé du coût de la vie de chaque pays, contrairement à une simple
 * conversion de change. OCDE, Regards sur l'éducation 2023.
 * https://www.cafepedagogique.net/2023/09/12/regards-sur-leducation-les-enseignants-francais-toujours-mal-payes/ */
const COUNTRIES = [
  { label: "France", debut: 37720, apres15: 40683 },
  { label: "Espagne", debut: 49905, apres15: 51715 },
  { label: "Allemagne", debut: 77905, apres15: 85699 },
];

export function TeacherSalaryChart() {
  const width = 480;
  const height = 220;
  const marginLeft = 8;
  const marginRight = 8;
  const marginTop: number = 12;
  const marginBottom = 30;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const maxValue = 90000;
  const groupWidth = plotWidth / COUNTRIES.length;
  const barWidth = 46;
  const barGap = 4;
  const [hover, setHover] = useState<{ group: number; series: "debut" | "apres15" } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const yFor = (v: number) => marginTop + plotHeight - (v / maxValue) * plotHeight;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Salaire des professeurs de collège, à pouvoir d&apos;achat comparable</h3>
      <p className={styles.chartSubtitle}>USD PPA (déjà corrigé du coût de la vie de chaque pays)</p>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchDebut}`} /> Début de carrière
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchApres}`} /> Après 15 ans
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="En parité de pouvoir d'achat, un professeur de collège français débute à 37 720 USD et atteint 40 683 USD après 15 ans, contre 49 905 puis 51 715 USD en Espagne, et 77 905 puis 85 699 USD en Allemagne."
      >
        <line x1={marginLeft} y1={marginTop + plotHeight} x2={width - marginRight} y2={marginTop + plotHeight} className={styles.axisLine} />
        {COUNTRIES.map((c, i) => {
          const groupX = marginLeft + i * groupWidth + groupWidth / 2;
          const xDebut = groupX - barGap / 2 - barWidth;
          const xApres = groupX + barGap / 2;
          const hDebut = (c.debut / maxValue) * plotHeight;
          const hApres = (c.apres15 / maxValue) * plotHeight;
          const isDebutHover = hover?.group === i && hover.series === "debut";
          const isApresHover = hover?.group === i && hover.series === "apres15";

          return (
            <g key={c.label}>
              <g
                tabIndex={0}
                onPointerEnter={() => setHover({ group: i, series: "debut" })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ group: i, series: "debut" })}
                onBlur={() => setHover(null)}
                className={styles.interactiveGroup}
              >
                <rect x={xDebut} y={yFor(c.debut)} width={barWidth} height={hDebut} rx={3} className={isDebutHover ? styles.debutHover : styles.debut} />
                <text x={xDebut + barWidth / 2} y={yFor(c.debut) - 6} textAnchor="middle" className={styles.valueLabel}>
                  {c.debut.toLocaleString("fr-FR")}
                </text>
              </g>
              <g
                tabIndex={0}
                onPointerEnter={() => setHover({ group: i, series: "apres15" })}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover({ group: i, series: "apres15" })}
                onBlur={() => setHover(null)}
                className={styles.interactiveGroup}
              >
                <rect x={xApres} y={yFor(c.apres15)} width={barWidth} height={hApres} rx={3} className={isApresHover ? styles.apresHover : styles.apres} />
                <text x={xApres + barWidth / 2} y={yFor(c.apres15) - 6} textAnchor="middle" className={styles.valueLabel}>
                  {c.apres15.toLocaleString("fr-FR")}
                </text>
              </g>
              <text x={groupX} y={height - 10} textAnchor="middle" className={styles.axisLabel}>
                {c.label}
              </text>
            </g>
          );
        })}
      </svg>
      <table className={styles.srOnly}>
        <caption>Salaire des professeurs de collège en USD PPA (OCDE, Regards sur l&apos;éducation 2023)</caption>
        <thead>
          <tr>
            <th scope="col">Pays</th>
            <th scope="col">Début de carrière</th>
            <th scope="col">Après 15 ans</th>
          </tr>
        </thead>
        <tbody>
          {COUNTRIES.map((c) => (
            <tr key={c.label}>
              <td>{c.label}</td>
              <td>{c.debut.toLocaleString("fr-FR")} USD PPA</td>
              <td>{c.apres15.toLocaleString("fr-FR")} USD PPA</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
