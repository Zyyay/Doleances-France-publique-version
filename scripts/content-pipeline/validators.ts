import { isWhitelistedUrl } from "./config";

export interface ValidationIssue {
  field: string;
  message: string;
}

export function checkLength(field: string, value: string, max: number, issues: ValidationIssue[]): void {
  if (value.length > max) {
    issues.push({ field, message: `${field} is ${value.length} chars, exceeds the ${max}-char limit` });
  }
}

export function checkWhitelisted(field: string, url: string, issues: ValidationIssue[]): void {
  if (!isWhitelistedUrl(url)) {
    issues.push({ field, message: `${field} URL "${url}" is not in the source whitelist` });
  }
}

const SLUG_FORMAT = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Mirrors the subjects_slug_format check constraint in the database. */
export function checkSlugFormat(field: string, slug: string, issues: ValidationIssue[]): void {
  if (!SLUG_FORMAT.test(slug)) {
    issues.push({ field, message: `${field} "${slug}" must be lowercase words separated by hyphens` });
  }
}
