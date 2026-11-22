import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * False during server rendering and hydration, true once running in the
 * browser — for things that need `document`, like createPortal targets.
 * Replaces the `useEffect(() => setMounted(true), [])` pattern, which
 * React's lint rules flag as a cascading render.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
