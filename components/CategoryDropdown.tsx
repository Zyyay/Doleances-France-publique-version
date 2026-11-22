"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CategoryBadge } from "@/components/CategoryBadge";
import { type CategoryRow } from "@/lib/subjects";
import styles from "./SiteChrome.module.css";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} width={13} height={13}>
      <path d="M5.5 8l4.5 4.5L14.5 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The menu also opens on :hover/:focus-within in CSS (see SiteChrome.module.css)
 * for an instant desktop-mouse feel — this component adds an explicit
 * click/tap toggle on top of that, since :focus-within alone isn't reliable
 * on touch (tapping a <button> doesn't always focus it, notably on iOS
 * Safari), which left the menu unopenable on some phones.
 */
export function CategoryDropdown({ categories }: { categories: CategoryRow[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [isOpen]);

  return (
    <div className={styles.catDropdown} data-open={isOpen} ref={ref}>
      <button className={styles.catTrigger} type="button" aria-expanded={isOpen} onClick={() => setIsOpen((v) => !v)}>
        Catégories
        <ChevronIcon />
      </button>
      <div className={styles.catMenu}>
        {categories.map((category) => (
          <Link
            key={category.slug}
            className={styles.catMenuItem}
            href={`/?categorie=${category.slug}#sujets`}
            onClick={() => setIsOpen(false)}
          >
            <CategoryBadge slug={category.slug} size={20} />
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
