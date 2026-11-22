"use client";

import { useRef, useState } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./PassCultureSpendingChart.module.css";

/** Répartition des dépenses de la part individuelle du Pass Culture, en %
 * des montants réservés (2024). Le poste "Livres" (54 % au total) est
 * scindé pour isoler les mangas, cités séparément dans la synthèse ;
 * "Autres catégories" est calculé par différence (jeux vidéo, instruments
 * de musique, presse, beaux-arts...), la synthèse ne détaillant que
 * livres, cinéma, spectacle vivant et musées. */
const DATA = [
  { label: "Livres (hors mangas)", pct: 45 },
  { label: "Autres catégories", pct: 26 },
  { label: "Cinéma", pct: 18 },
  { label: "Mangas", pct: 9 },
  { label: "Musées", pct: 1 },
  { label: "Spectacle vivant", pct: 1 },
];

function BarRow({ data, maxValue }: { data: { label: string; pct: number }[]; maxValue: number }) {
  const width = 480;
  const rowHeight = 26;
  const gap = 8;
  const marginLeft = 148;
  const height = data.length * rowHeight + (data.length - 1) * gap;
  const plotWidth = width - marginLeft - 40;
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img">
      {data.map((d, i) => {
        const y = i * (rowHeight + gap);
        const barW = (d.pct / maxValue) * plotWidth;
        const isAccent = i === 0;
        const isHover = hover === i;
        return (
          <g
            key={d.label}
            tabIndex={0}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className={styles.interactiveGroup}
          >
            <text x={marginLeft - 8} y={y + rowHeight / 2 + 4} textAnchor="end" className={styles.rowLabel}>
              {d.label}
            </text>
            <rect x={marginLeft} y={y} width={plotWidth} height={rowHeight} rx={4} className={styles.track} />
            <rect
              x={marginLeft}
              y={y}
              width={Math.max(barW, 3)}
              height={rowHeight}
              rx={4}
              className={isAccent ? styles.barAccent : isHover ? styles.barHover : styles.bar}
            />
            <text x={marginLeft + Math.max(barW, 3) + 8} y={y + rowHeight / 2 + 4} className={styles.valueLabel}>
              {d.pct} %
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function PassCultureSpendingChart() {
  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Où va la part individuelle du Pass Culture</h3>
      <p className={styles.chartSubtitle}>Répartition des montants réservés, 2024</p>
      <BarRow data={DATA} maxValue={50} />
      <table className={styles.srOnly}>
        <caption>Répartition des dépenses de la part individuelle du Pass Culture, 2024</caption>
        <thead>
          <tr>
            <th scope="col">Catégorie</th>
            <th scope="col">Part des dépenses</th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.pct} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
