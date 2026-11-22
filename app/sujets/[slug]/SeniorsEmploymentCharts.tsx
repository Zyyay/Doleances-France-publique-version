"use client";

import { useRef, useState } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./SeniorsEmploymentCharts.module.css";

/** Eurostat via Insee, Emploi et chômage en Europe. */
const COMPARISON = [
  { label: "France", value: 60.4 },
  { label: "UE", value: 65.2 },
  { label: "Allemagne", value: 75.2 },
  { label: "Pays-Bas", value: 75.3 },
  { label: "Suède", value: 78.1 },
];

function BarRow({ data, maxValue, accentIndex }: { data: { label: string; value: number }[]; maxValue: number; accentIndex?: number }) {
  const width = 460;
  const rowHeight = 30;
  const gap = 8;
  const marginLeft = 108;
  const height = data.length * rowHeight + (data.length - 1) * gap;
  const plotWidth = width - marginLeft - 44;
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img">
      {data.map((d, i) => {
        const y = i * (rowHeight + gap);
        const barW = (d.value / maxValue) * plotWidth;
        const isAccent = accentIndex === i;
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
              width={barW}
              height={rowHeight}
              rx={4}
              className={isAccent ? styles.barAccent : isHover ? styles.barHover : styles.bar}
            />
            <text x={marginLeft + barW + 8} y={y + rowHeight / 2 + 4} className={styles.valueLabel}>
              {d.value.toLocaleString("fr-FR")} %
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function SeniorsEmploymentCharts() {
  return (
    <div className={styles.wrap}>
      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>La France en retard sur ses voisins (55-64 ans)</h3>
        <p className={styles.chartSubtitle}>Taux d&apos;emploi : part de la population en emploi (retraités inclus dans le total)</p>
        <BarRow data={COMPARISON} maxValue={90} accentIndex={0} />
      </div>

      <div className={styles.statRow}>
        <div className={styles.statTile}>
          <div className={styles.statValue}>5,2 %</div>
          <div className={styles.statLabel}>de chômage chez les 55-64 ans, contre 7,5 % pour l&apos;ensemble des actifs — mais deux fois plus long en moyenne</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statValue}>21 %</div>
          <div className={styles.statLabel}>des 55-61 ans ne sont ni en emploi ni à la retraite — une zone grise absente des statistiques du chômage</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statValue}>1 sur 4</div>
          <div className={styles.statLabel}>senior déclare avoir subi une discrimination liée à l&apos;âge dans l&apos;emploi</div>
        </div>
      </div>
    </div>
  );
}
