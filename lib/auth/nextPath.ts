/**
 * `?next=` carries the page a visitor was on when they clicked "Se connecter"
 * / "Créer un compte" (e.g. a subject they were about to vote on), so every
 * sign-in path (email, Google, profile completion) can send them back there
 * instead of the homepage.
 */

const AUTH_PATH_PREFIXES = ["/connexion", "/inscription", "/completer-profil"];

/** Only same-origin relative paths — never `//evil.com` or `/\evil.com`, which browsers treat as absolute URLs. */
export function safeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Returns the path worth coming back to, or null for the homepage and the auth pages themselves. */
export function returnPathFrom(pathname: string | null): string | null {
  if (!pathname || pathname === "/") return null;
  if (AUTH_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;
  return pathname;
}

export function withNext(href: string, next: string | null | undefined): string {
  return next ? `${href}?next=${encodeURIComponent(next)}` : href;
}
