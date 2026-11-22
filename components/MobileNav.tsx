"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { CategoryBadge } from "@/components/CategoryBadge";
import { type CategoryRow } from "@/lib/subjects";
import { useIsClient } from "@/lib/useIsClient";
import styles from "./SiteChrome.module.css";

function BurgerIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

/** Burger menu — only rendered/visible below the 900px breakpoint where SiteNav's
 * .primaryLinks/.secondaryLinks are hidden (see SiteChrome.module.css), so this is
 * the only way to reach category filters and the secondary links on mobile.
 *
 * The panel is portaled to document.body rather than rendered in place. It needs
 * position: fixed to stay correctly placed under the header while scrolled — but
 * .nav (its DOM ancestor otherwise) has backdrop-filter, which — like transform,
 * filter or will-change — makes an element the containing block for its
 * position: fixed descendants too, not just position: absolute ones. Left in
 * place, the panel would still resolve "fixed" positioning against .nav's own
 * box, defeating the point. Portaling to <body> sidesteps that entirely. */
export function MobileNav({ categories }: { categories: CategoryRow[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const mounted = useIsClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeydown);

    // Locking scroll via `body { overflow: hidden }` breaks .nav's
    // position: sticky while the menu is open: window.scrollY stays put,
    // but the sticky nav visually snaps back to its unstuck (top-of-page)
    // position, dragging the burger button off-screen with it. Freezing
    // the body at its current offset with position: fixed instead avoids
    // touching overflow entirely, so sticky positioning is unaffected.
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeydown);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  return (
    <div className={styles.mobileNav}>
      <button
        ref={triggerRef}
        className={styles.mobileNavTrigger}
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setIsOpen((v) => !v)}
      >
        {isOpen ? <CloseIcon /> : <BurgerIcon />}
      </button>

      {isOpen &&
        mounted &&
        createPortal(
          <div ref={panelRef} className={styles.mobileNavPanel}>
            <div className={styles.mobileNavSection}>
              <span className={styles.mobileNavSectionTitle}>Catégories</span>
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  className={styles.mobileNavLink}
                  href={`/?categorie=${category.slug}#sujets`}
                  onClick={() => setIsOpen(false)}
                >
                  <CategoryBadge slug={category.slug} size={22} />
                  {category.name}
                </Link>
              ))}
            </div>
            <div className={styles.mobileNavSection}>
              <Link className={styles.mobileNavLink} href="/a-propos#sources" onClick={() => setIsOpen(false)}>
                Source de données
              </Link>
              <Link className={styles.mobileNavLink} href="/a-propos#methodologie" onClick={() => setIsOpen(false)}>
                Méthodologie
              </Link>
              <Link className={styles.mobileNavLink} href="/a-propos#projet" onClick={() => setIsOpen(false)}>
                A propos
              </Link>
              <Link className={styles.mobileNavLink} href="/a-propos#contact" onClick={() => setIsOpen(false)}>
                Nous contacter
              </Link>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
