"use client";

import { useEffect, type RefObject } from "react";

/**
 * Clears a hover/tooltip state on tap outside the given element. Needed for
 * touch: onPointerEnter opens a tooltip on tap, but there's no onPointerLeave
 * afterward (the finger just lifts, it doesn't "leave" over a boundary), so
 * without this the tooltip stays stuck open until another data point is
 * tapped — tapping anywhere else on the page did nothing to close it.
 */
export function useOutsideTapDismiss(ref: RefObject<Element | null>, dismiss: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) dismiss();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [active, ref, dismiss]);
}
