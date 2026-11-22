"use client";

import { useRef, useState } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./CorruptionDelayChart.module.css";

/** Durée cumulée de la procédure (1ère instance + appel), en années.
 * Cour des comptes / Sénat — voir les décisions gouvernementales du sujet. */
const DATA = [
  { label: "Justiciable ordinaire (moyenne, toutes affaires pénales)", years: 0.75, display: "9 mois" },
  { label: "Élu poursuivi pour corruption", years: 14.4, display: "14,4 ans" },
];

export function CorruptionDelayChart() {
  const width = 480;
  const rowHeight = 34;
  const gap = 12;
  const marginLeft = 8;
  const marginRight = 60;
  const height = DATA.length * rowHeight + (DATA.length - 1) * gap + 16;
  const plotWidth = width - marginLeft - marginRight;
  const maxValue = 15;
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Durée cumulée de la procédure (1ᵉʳᵉ instance + appel)</h3>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Un élu poursuivi pour corruption attend 14,4 ans en cumulant première instance et appel, contre 9 mois en moyenne pour l'ensemble des affaires pénales — environ 19 fois plus long."
      >
        {DATA.map((d, i) => {
          const y = 8 + i * (rowHeight + gap);
          const barW = (d.years / maxValue) * plotWidth;
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
              <text x={marginLeft} y={y - 6} className={styles.rowLabel}>
                {d.label}
              </text>
              <rect x={marginLeft} y={y} width={plotWidth} height={rowHeight - 12} rx={4} className={styles.track} />
              <rect
                x={marginLeft}
                y={y}
                width={Math.max(barW, 3)}
                height={rowHeight - 12}
                rx={4}
                className={isHover ? styles.barHover : i === 1 ? styles.barAccent : styles.bar}
              />
              <text x={marginLeft + Math.max(barW, 3) + 8} y={y + (rowHeight - 12) / 2 + 4} className={styles.valueLabel}>
                {d.display}
              </text>
            </g>
          );
        })}
      </svg>
      <table className={styles.srOnly}>
        <caption>Durée cumulée de la procédure judiciaire, élu poursuivi pour corruption vs justiciable ordinaire</caption>
        <thead>
          <tr>
            <th scope="col">Profil</th>
            <th scope="col">Durée</th>
          </tr>
        </thead>
        <tbody>
          {DATA.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{d.display}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.statTile}>
        <div className={styles.statValue}>×4</div>
        <div className={styles.statLabel}>plus de chances d&apos;être acquitté pour un élu poursuivi que pour un justiciable ordinaire</div>
      </div>
    </div>
  );
}
