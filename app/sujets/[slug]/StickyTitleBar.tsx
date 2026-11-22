"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StickyTitleBar.module.css";

// Roughly the height of the hero title block — below this, the bar never
// shows regardless of scroll direction (it would be redundant with the
// real title still on screen).
const SHOW_AFTER_PX = 220;

/**
 * "Quick return" pattern: hides on scroll down, reappears the instant the
 * user scrolls up even slightly (no need to scroll all the way back to top).
 */
export function StickyTitleBar({ title }: { title: string }) {
  const [visible, setVisible] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < SHOW_AFTER_PX) setVisible(false);
        else if (y < lastY.current) setVisible(true);
        else if (y > lastY.current) setVisible(false);
        lastY.current = y;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`${styles.bar} ${visible ? styles.visible : ""}`} aria-hidden={!visible}>
      <div className={styles.inner}>
        <span className={styles.title}>{title}</span>
      </div>
    </div>
  );
}
