"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./PrisonPopulationChart.module.css";

/** Détenus, places opérationnelles et écroués non détenus (bracelet, semi-liberté...).
 * 1980-2022 : ministère de la Justice, séries statistiques PPSMJ, tableaux 1 et 3 (au 1er janvier) —
 * https://www.justice.gouv.fr/sites/default/files/2023-04/PPSMJ_2022_vf.pdf
 * Octobre 2025 : Sénat, avis budgétaire 2026 (84 862 détenus, densité 135,8 %, 16 024 écroués non
 * détenus ; places déduites de la densité) — https://www.senat.fr/rap/a25-145-6/a25-145-6-syn.pdf
 * Septembre 2026 : ministère de la Justice (90 020 détenus, 63 348 places). */
const POINTS: { label: string; year: number; detenus: number; places: number | null; nonDetenus: number | null }[] = [
  { label: "1980", year: 1980, detenus: 36913, places: null, nonDetenus: null },
  { label: "1985", year: 1985, detenus: 44498, places: null, nonDetenus: null },
  { label: "1990", year: 1990, detenus: 45420, places: 36615, nonDetenus: null },
  { label: "1995", year: 1995, detenus: 53935, places: 48187, nonDetenus: null },
  { label: "2001", year: 2001, detenus: 47837, places: 48593, nonDetenus: null },
  { label: "2005", year: 2005, detenus: 58231, places: 50094, nonDetenus: 966 },
  { label: "2010", year: 2010, detenus: 60978, places: 54988, nonDetenus: 5111 },
  { label: "2015", year: 2015, detenus: 66270, places: 57841, nonDetenus: 11021 },
  { label: "2020", year: 2020, detenus: 70739, places: 61037, nonDetenus: 12184 },
  { label: "2021", year: 2021, detenus: 62673, places: 60583, nonDetenus: 12348 },
  { label: "2022", year: 2022, detenus: 69448, places: 60749, nonDetenus: 13819 },
  { label: "oct. 2025", year: 2025.75, detenus: 84862, places: 62490, nonDetenus: 16024 },
  { label: "sept. 2026", year: 2026.67, detenus: 90020, places: 63348, nonDetenus: null },
];

const AXIS_YEARS = [1980, 1990, 2000, 2010, 2020];
const numberFormatter = new Intl.NumberFormat("fr-FR");

export function PrisonPopulationChart() {
  const width = 480;
  const height = 250;
  const marginLeft = 34;
  const marginRight = 72;
  const marginTop = 14;
  const marginBottom = 26;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const minYear = 1980;
  const maxYear = 2026.67;
  const maxValue = 100000;
  const ticks = [0, 25000, 50000, 75000, 100000];
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const xFor = (year: number) => marginLeft + ((year - minYear) / (maxYear - minYear)) * plotWidth;
  const yFor = (v: number) => marginTop + plotHeight - (v / maxValue) * plotHeight;
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const detenusPts = POINTS.map((p) => ({ x: xFor(p.year), y: yFor(p.detenus) }));
  const withPlaces = POINTS.filter((p) => p.places !== null);
  const gapPolygon = [
    ...withPlaces.map((p) => `${xFor(p.year)},${yFor(p.detenus)}`),
    ...[...withPlaces].reverse().map((p) => `${xFor(p.year)},${yFor(p.places as number)}`),
  ].join(" ");
  const withNonDetenus = POINTS.filter((p) => p.nonDetenus !== null);
  const baseline = yFor(0);
  const nonDetenusArea = [
    `${xFor(withNonDetenus[0].year)},${baseline}`,
    ...withNonDetenus.map((p) => `${xFor(p.year)},${yFor(p.nonDetenus as number)}`),
    `${xFor(withNonDetenus[withNonDetenus.length - 1].year)},${baseline}`,
  ].join(" ");
  const last = POINTS[POINTS.length - 1];

  function handleMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    POINTS.forEach((p, i) => {
      const d = Math.abs(xFor(p.year) - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  const hovered = hover !== null ? POINTS[hover] : null;
  const tooltipLines = hovered
    ? [
        `${numberFormatter.format(hovered.detenus)} détenus`,
        hovered.places !== null ? `Occupation : ${Math.round((hovered.detenus / hovered.places) * 100)} %` : null,
        hovered.nonDetenus !== null ? `${numberFormatter.format(hovered.nonDetenus)} écroués non détenus` : null,
      ].filter((line): line is string => line !== null)
    : [];
  const tooltipWidth = 168;
  const tooltipHeight = 22 + tooltipLines.length * 15;
  const tooltipX = hovered ? Math.min(Math.max(xFor(hovered.year) - tooltipWidth / 2, 2), width - tooltipWidth - 2) : 0;
  const tooltipY = hovered ? Math.max(2, yFor(hovered.detenus) - tooltipHeight - 12) : 0;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>45 ans de prisons françaises : détenus et surpopulation</h3>
      <p className={styles.chartSubtitle}>Au 1er janvier, sauf derniers points. Ministère de la Justice, Sénat.</p>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.swatchLine} ${styles.swatchDetenus}`} /> Détenus
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchGap}`} /> Surpopulation
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.swatch} ${styles.swatchNonDetenus}`} /> Écroués non détenus (bracelet…)
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Entre 1980 et 2026, le nombre de détenus est passé de 36 913 à 90 020, et l'occupation des prisons a atteint 142 % en 2026 ; dans le même temps, le nombre de personnes écrouées sous bracelet ou en aménagement est passé de moins de 1 000 en 2005 à plus de 16 000 en 2025."
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = yFor(t);
          return (
            <g key={t}>
              <line x1={marginLeft} x2={width - marginRight} y1={y} y2={y} className={styles.gridline} />
              <text x={marginLeft - 6} y={y} textAnchor="end" dominantBaseline="middle" className={styles.axisLabel}>
                {t === 0 ? "0" : `${t / 1000} k`}
              </text>
            </g>
          );
        })}
        {AXIS_YEARS.map((year) => (
          <text key={year} x={xFor(year)} y={marginTop + plotHeight + 18} textAnchor="middle" className={styles.axisLabel}>
            {year}
          </text>
        ))}
        <polygon points={nonDetenusArea} className={styles.nonDetenusArea} />
        <polygon points={gapPolygon} className={styles.gapArea} />
        <path d={toPath(detenusPts)} className={styles.detenusLine} fill="none" />
        {hovered && (
          <line x1={xFor(hovered.year)} x2={xFor(hovered.year)} y1={marginTop} y2={marginTop + plotHeight} className={styles.crosshair} />
        )}
        {POINTS.map((p, i) => (
          <g key={p.label} tabIndex={0} onFocus={() => setHover(i)} onBlur={() => setHover(null)} className={styles.interactiveGroup}>
            <circle cx={xFor(p.year)} cy={yFor(p.detenus)} r={hover === i ? 4.5 : 3} className={styles.detenusMarker} />
          </g>
        ))}
        <text x={xFor(last.year) + 6} y={yFor(last.detenus)} dominantBaseline="middle" className={styles.endLabel}>
          90 020
        </text>
        <text
          x={xFor(last.year) + 6}
          y={(yFor(last.detenus) + yFor(last.places as number)) / 2}
          dominantBaseline="middle"
          className={styles.endLabelAccent}
        >
          142 %
        </text>
        {hovered && (
          <g pointerEvents="none">
            <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx={6} className={styles.tooltipBg} />
            <text x={tooltipX + 10} y={tooltipY + 16} className={styles.tooltipTitle}>
              {hovered.label}
            </text>
            {tooltipLines.map((line, i) => (
              <text key={line} x={tooltipX + 10} y={tooltipY + 31 + i * 15} className={styles.tooltipText}>
                {line}
              </text>
            ))}
          </g>
        )}
      </svg>
      <table className={styles.srOnly}>
        <caption>Détenus, places opérationnelles et écroués non détenus en France, 1980-2026</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Détenus</th>
            <th scope="col">Places</th>
            <th scope="col">Écroués non détenus</th>
          </tr>
        </thead>
        <tbody>
          {POINTS.map((p) => (
            <tr key={p.label}>
              <td>{p.label}</td>
              <td>{numberFormatter.format(p.detenus)}</td>
              <td>{p.places !== null ? numberFormatter.format(p.places) : "n.d."}</td>
              <td>{p.nonDetenus !== null ? numberFormatter.format(p.nonDetenus) : "n.d."}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
