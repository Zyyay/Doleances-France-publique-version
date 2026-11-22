export interface PasswordCheck {
  valid: boolean;
  issues: string[];
}

/** "Standards renforcés classiques" : longueur + diversité de caractères. */
export function checkPasswordStrength(password: string): PasswordCheck {
  const issues: string[] = [];
  if (password.length < 10) issues.push("au moins 10 caractères");
  if (!/[a-z]/.test(password)) issues.push("une lettre minuscule");
  if (!/[A-Z]/.test(password)) issues.push("une lettre majuscule");
  if (!/[0-9]/.test(password)) issues.push("un chiffre");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("un caractère spécial (ex. ! ? # -)");
  return { valid: issues.length === 0, issues };
}
