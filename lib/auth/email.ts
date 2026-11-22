import disposableDomains from "disposable-email-domains";
import disposableWildcards from "disposable-email-domains/wildcard.json";

const EXACT_BLOCKLIST = new Set(disposableDomains.map((d) => d.toLowerCase()));
const WILDCARD_BLOCKLIST = disposableWildcards.map((d) => d.toLowerCase());

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT.test(email.trim());
}

/** Domain match is suffix-based for the wildcard list, so any subdomain of a
 * known throwaway provider is also blocked. */
export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain) return true;
  if (EXACT_BLOCKLIST.has(domain)) return true;
  return WILDCARD_BLOCKLIST.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`));
}
