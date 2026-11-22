"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./BacSuccessRateChart.module.css";

/** Taux de réussite au baccalauréat (ensemble des séries), en %. */
const YEARS = [1995, 2010, 2024];
const TAUX = [75, 85, 91.4];

export function BacSuccessRateChart() {
  const width = 480;
  const height = 200;
  const marginLeft = 34;
  const marginBottom = 26;
  const marginTop = 16;
  const plotWidth = width - marginLeft - 40;
  const plotHeight = height - marginTop - marginBottom;
  const minValue = 70;
  const maxValue = 95;
  const ticks = [70, 75, 80, 85, 90, 95];
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const xFor = (i: number) => marginLeft + (i / (YEARS.length - 1)) * plotWidth;
  const yFor = (v: number) => marginTop + plotHeight - ((v - minValue) / (maxValue - minValue)) * plotHeight;
  const points = YEARS.map((year, i) => ({ year, value: TAUX[i], x: xFor(i), y: yFor(TAUX[i]) }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const lastIndex = points.length - 1;

  function handleMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    let nearest = 0;
    let best = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(p.x - relX);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Taux de réussite au baccalauréat</h3>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Évolution du taux de réussite au baccalauréat : 75 % en 1995, 85 % en 2010, 91,4 % en 2024."
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = yFor(t);
          return (
            <g key={t}>
              <line x1={marginLeft} x2={width - 4} y1={y} y2={y} className={styles.gridline} />
              <text x={marginLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" className={styles.axisLabel}>
                {t} %
              </text>
            </g>
          );
        })}
        {hover !== null && (
          <line x1={points[hover].x} x2={points[hover].x} y1={marginTop} y2={marginTop + plotHeight} className={styles.crosshair} />
        )}
        <path d={path} className={styles.line} fill="none" />
        {points.map((p, i) => (
          <g key={p.year} tabIndex={0} onFocus={() => setHover(i)} onBlur={() => setHover(null)}>
            <circle cx={p.x} cy={p.y} r={5} className={styles.marker} />
            <text x={p.x} y={marginTop + plotHeight + 18} textAnchor="middle" className={styles.axisLabel}>
              {p.year}
            </text>
          </g>
        ))}
        {hover === null || hover !== lastIndex ? (
          <text x={points[lastIndex].x} y={points[lastIndex].y - 12} textAnchor="end" className={styles.endLabel}>
            91,4 %
          </text>
        ) : null}
        {hover !== null && (
          <g>
            <rect x={Math.min(points[hover].x - 22, width - 48)} y={Math.max(2, points[hover].y - 30)} width={48} height={20} rx={5} className={styles.tooltipBg} />
            <text
              x={Math.min(points[hover].x, width - 24)}
              y={Math.max(2, points[hover].y - 30) + 14}
              textAnchor="middle"
              className={styles.tooltipText}
            >
              {points[hover].value} %
            </text>
          </g>
        )}
      </svg>
      <table className={styles.srOnly}>
        <caption>Taux de réussite au baccalauréat, 1995-2024</caption>
        <thead>
          <tr>
            <th scope="col">Année</th>
            <th scope="col">Taux de réussite</th>
          </tr>
        </thead>
        <tbody>
          {YEARS.map((year, i) => (
            <tr key={year}>
              <td>{year}</td>
              <td>{TAUX[i]} %</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
