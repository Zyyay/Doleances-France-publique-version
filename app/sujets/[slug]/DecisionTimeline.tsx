"use client";

import { useState, type CSSProperties } from "react";
import type { GovernmentPositionRow } from "@/lib/subjects";
import styles from "./subject.module.css";

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <path d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M12 4h4v4M16 4l-7 7" />
    </svg>
  );
}

function ObjectifIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="3.5" />
      <circle cx="10" cy="10" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function ConstatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6}>
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13l4 4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  );
}

/** Government positions are drafted as "Objectif : ...\n\nConstat : ..." (see prompts/decisions-extract.md) — split so each half renders as its own labeled, iconed line instead of one run-on paragraph. Line endings are normalized first: rows written via the SQL editor can carry \r\n instead of \n. */
function parseDecisionDescription(rawDescription: string): { objectif: string; constat: string } {
  const description = rawDescription.replace(/\r\n/g, "\n");
  const marker = "\n\nConstat :";
  const splitAt = description.indexOf(marker);

  const objectifPart = splitAt === -1 ? description : description.slice(0, splitAt);
  const objectif = objectifPart.replace(/^Objectif\s*:\s*/, "").trim();
  if (splitAt === -1) return { objectif, constat: "" };

  const constat = description.slice(splitAt + marker.length).trim();
  return { objectif, constat };
}

function DecisionDescription({ description }: { description: string }) {
  const { objectif, constat } = parseDecisionDescription(description);
  return (
    <div className={styles.timelineDesc}>
      <p className={styles.timelineDescRow}>
        <span className={styles.timelineDescLabel}>
          <ObjectifIcon />
          Objectif
        </span>
        {objectif}
      </p>
      {constat && (
        <p className={styles.timelineDescRow}>
          <span className={styles.timelineDescLabel}>
            <ConstatIcon />
            Constat
          </span>
          {constat}
        </p>
      )}
    </div>
  );
}

/**
 * Collapsed by default (year + title only) — clicking any card expands the
 * text of every decision on the page at once, clicking again collapses them
 * all. Deliberately not a per-card accordion: with several decisions per
 * subject, exclusive open-one-at-a-time made it easy to miss that the others
 * were readable too.
 */
export function DecisionTimeline({ positions, colorVar }: { positions: GovernmentPositionRow[]; colorVar?: string }) {
  const [allOpen, setAllOpen] = useState(false);

  function toggle() {
    setAllOpen((current) => !current);
  }

  return (
    <div
      className={styles.timeline}
      style={colorVar ? ({ "--timeline-color": `var(${colorVar})` } as CSSProperties) : undefined}
    >
      {positions.map((position) => {
        const isOpen = allOpen;
        return (
          <div className={`${styles.timelineItem} ${styles[position.stance]}`} key={position.id}>
            <button
              type="button"
              className={styles.timelineHead}
              onClick={toggle}
              aria-expanded={isOpen}
            >
              <span className={styles.timelineHeadText}>
                <span className={styles.timelineYear}>{new Date(position.position_date).getFullYear()}</span>
                <span className={styles.timelineTitle}>{position.title}</span>
              </span>
              <span className={`${styles.timelineChevron} ${isOpen ? styles.timelineChevronOpen : ""}`}>
                <ChevronIcon />
              </span>
            </button>
            {isOpen && (
              <div className={styles.timelineBody}>
                <DecisionDescription description={position.description} />
                {position.source_url && (
                  <a className={styles.argSource} href={position.source_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon />
                    Source
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
