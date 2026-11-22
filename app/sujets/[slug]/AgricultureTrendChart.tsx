"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useOutsideTapDismiss } from "@/lib/useOutsideTapDismiss";
import styles from "./AgricultureTrendChart.module.css";

/** Recensements agricoles 1970-2020 (Insee/Agreste) — https://www.insee.fr/fr/statistiques/7728893 */
const YEARS = [1970, 1979, 1988, 2000, 2010, 2020];
const EXPLOITATIONS = [1587639, 1262669, 1016755, 663807, 489977, 389779];
const SAU_MOYENNE_HA = [19, 23, 28, 42, 55, 69];

const numberFormatter = new Intl.NumberFormat("fr-FR");

function ExploitationsBarChart() {
  const width = 480;
  const height = 220;
  const marginLeft = 46;
  const marginBottom = 26;
  const marginTop = 12;
  const plotWidth = width - marginLeft - 8;
  const plotHeight = height - marginTop - marginBottom;
  const maxValue = 1600000;
  const ticks = [0, 400000, 800000, 1200000, 1600000];
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const bandWidth = plotWidth / YEARS.length;
  const barWidth = Math.min(24, bandWidth * 0.55);

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>Nombre d&apos;exploitations agricoles</h3>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Évolution du nombre d'exploitations agricoles en France de 1970 à 2020 : de 1 587 639 à 389 779, une division par quatre."
      >
        {ticks.map((t) => {
          const y = marginTop + plotHeight - (t / maxValue) * plotHeight;
          return (
            <g key={t}>
              <line x1={marginLeft} x2={width - 4} y1={y} y2={y} className={styles.gridline} />
              <text x={marginLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" className={styles.axisLabel}>
                {t === 0 ? "0" : `${t / 1000000} M`}
              </text>
            </g>
          );
        })}
        {YEARS.map((year, i) => {
          const value = EXPLOITATIONS[i];
          const barHeight = (value / maxValue) * plotHeight;
          const x = marginLeft + i * bandWidth + (bandWidth - barWidth) / 2;
          const y = marginTop + plotHeight - barHeight;
          const isHover = hover === i;
          const tooltipWidth = 74;
          const tooltipX = Math.min(Math.max(x + barWidth / 2, marginLeft + tooltipWidth / 2), width - tooltipWidth / 2 - 2);
          return (
            <g
              key={year}
              tabIndex={0}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className={styles.interactiveGroup}
            >
              <rect
                x={marginLeft + i * bandWidth}
                y={marginTop}
                width={bandWidth}
                height={plotHeight}
                fill="transparent"
              />
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} className={isHover ? styles.barHover : styles.bar} />
              <text x={x + barWidth / 2} y={marginTop + plotHeight + 18} textAnchor="middle" className={styles.axisLabel}>
                {year}
              </text>
              {isHover && (
                <g>
                  <rect x={tooltipX - tooltipWidth / 2} y={Math.max(2, y - 26)} width={tooltipWidth} height={20} rx={5} className={styles.tooltipBg} />
                  <text x={tooltipX} y={Math.max(2, y - 26) + 14} textAnchor="middle" className={styles.tooltipText}>
                    {numberFormatter.format(value)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <table className={styles.srOnly}>
        <caption>Nombre d&apos;exploitations agricoles en France, 1970-2020</caption>
        <thead>
          <tr>
            <th scope="col">Année</th>
            <th scope="col">Exploitations</th>
          </tr>
        </thead>
        <tbody>
          {YEARS.map((year, i) => (
            <tr key={year}>
              <td>{year}</td>
              <td>{numberFormatter.format(EXPLOITATIONS[i])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SauMoyenneLineChart() {
  const width = 480;
  const height = 220;
  const marginLeft = 34;
  const marginBottom = 26;
  const marginTop = 16;
  const plotWidth = width - marginLeft - 40;
  const plotHeight = height - marginTop - marginBottom;
  const maxValue = 80;
  const ticks = [0, 20, 40, 60, 80];
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  useOutsideTapDismiss(svgRef, () => setHover(null), hover !== null);

  const xFor = (i: number) => marginLeft + (i / (YEARS.length - 1)) * plotWidth;
  const yFor = (v: number) => marginTop + plotHeight - (v / maxValue) * plotHeight;
  const points = YEARS.map((year, i) => ({ year, value: SAU_MOYENNE_HA[i], x: xFor(i), y: yFor(SAU_MOYENNE_HA[i]) }));
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
      <h3 className={styles.chartTitle}>Surface agricole moyenne par exploitation</h3>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Évolution de la surface agricole moyenne par exploitation en France de 1970 à 2020 : de 19 à 69 hectares."
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => {
          const y = yFor(t);
          return (
            <g key={t}>
              <line x1={marginLeft} x2={width - 4} y1={y} y2={y} className={styles.gridline} />
              <text x={marginLeft - 8} y={y} textAnchor="end" dominantBaseline="middle" className={styles.axisLabel}>
                {t}
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
            69 ha
          </text>
        ) : null}
        {hover !== null && (
          <g>
            <rect x={Math.min(points[hover].x - 20, width - 44)} y={Math.max(2, points[hover].y - 30)} width={44} height={20} rx={5} className={styles.tooltipBg} />
            <text
              x={Math.min(points[hover].x, width - 22)}
              y={Math.max(2, points[hover].y - 30) + 14}
              textAnchor="middle"
              className={styles.tooltipText}
            >
              {points[hover].value} ha
            </text>
          </g>
        )}
      </svg>
      <table className={styles.srOnly}>
        <caption>Surface agricole utilisée moyenne par exploitation en France, 1970-2020</caption>
        <thead>
          <tr>
            <th scope="col">Année</th>
            <th scope="col">Hectares</th>
          </tr>
        </thead>
        <tbody>
          {YEARS.map((year, i) => (
            <tr key={year}>
              <td>{year}</td>
              <td>{SAU_MOYENNE_HA[i]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AgricultureTrendChart() {
  return (
    <div className={styles.grid}>
      <ExploitationsBarChart />
      <SauMoyenneLineChart />
    </div>
  );
}
