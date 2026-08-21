/**
 * Input validation helpers — matches mobile form-validation.ts.
 * Prevents injection of special characters, enforces max lengths, etc.
 */

// Characters forbidden in all user text fields (addresses, names, comments, etc.)
const FORBIDDEN_RE = /[<>{}[\]^#\\|~`!@$%&*+=;'"?]/g;

/** Strip forbidden characters from a string. */
export function sanitizeText(v: string): string {
  return v.replace(FORBIDDEN_RE, "").trim();
}

/** Validate a phone number (Congo format: +242 XX XXX XX XX). Max 15 chars. */
export function validatePhone(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (!t) return { ok: false, m: "Écrivez votre numéro de téléphone." };
  if (t.length > 15) return { ok: false, m: "Le numéro est trop long (max 15 caractères)." };
  // Must start with + and contain only digits after that
  if (!/^\+\d{8,14}$/.test(t.replace(/\s/g, ""))) {
    return { ok: false, m: "Numéro invalide. Ex: +242 06 123 4567." };
  }
  return { ok: true };
}

/** Validate a full name (2–80 chars, no special chars). */
export function validateName(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (!t) return { ok: false, m: "Écrivez votre prénom et votre nom." };
  if (t.length < 2) return { ok: false, m: "Votre nom est trop court." };
  if (t.length > 80) return { ok: false, m: "Votre nom est trop long (max 80 caractères)." };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: "Le nom contient des caractères non autorisés." };
  return { ok: true };
}

/** Validate a password (min 6 chars). */
export function validatePassword(v: string): { ok: true } | { ok: false; m: string } {
  if (!v) return { ok: false, m: "Écrivez un mot de passe." };
  if (v.length < 6) return { ok: false, m: "Le mot de passe doit faire au moins 6 caractères." };
  if (v.length > 128) return { ok: false, m: "Le mot de passe est trop long." };
  return { ok: true };
}

/** Validate an address (2–200 chars, no special injection chars). */
export function validateAddress(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (!t) return { ok: false, m: "Indiquez votre adresse." };
  if (t.length < 2) return { ok: false, m: "L'adresse est trop courte." };
  if (t.length > 200) return { ok: false, m: "L'adresse est trop longue (max 200 caractères)." };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: "L'adresse contient des caractères non autorisés." };
  return { ok: true };
}

/** Validate a business name (2–100 chars). */
export function validateBusinessName(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (!t) return { ok: false, m: "Indiquez le nom de votre commerce." };
  if (t.length < 2) return { ok: false, m: "Le nom est trop court." };
  if (t.length > 100) return { ok: false, m: "Le nom est trop long (max 100 caractères)." };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: "Le nom contient des caractères non autorisés." };
  return { ok: true };
}

/** Validate a description (max 500 chars). */
export function validateDescription(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (t.length > 500) return { ok: false, m: "La description est trop longue (max 500 caractères)." };
  return { ok: true };
}

/** Validate a price (min 10 FCFA). */
export function validatePrice(v: string | number): { ok: true } | { ok: false; m: string } {
  const n = typeof v === "string" ? Number(v.replace(/\s/g, "")) : v;
  if (isNaN(n) || n <= 0) return { ok: false, m: "Indiquez un prix valide." };
  if (n < 10) return { ok: false, m: "Le prix minimum est 10 FCFA." };
  if (n > 10_000_000) return { ok: false, m: "Le prix est trop élevé." };
  return { ok: true };
}

/** Validate quantity (1–99). */
export function validateQuantity(v: number): { ok: true } | { ok: false; m: string } {
  if (!Number.isInteger(v) || v < 1) return { ok: false, m: "Quantité invalide." };
  if (v > 99) return { ok: false, m: "Quantité maximale atteinte." };
  return { ok: true };
}

/** Validate an OTP code (6 digits). */
export function validateOtp(v: string): { ok: true } | { ok: false; m: string } {
  const t = v.trim().replace(/\s/g, "");
  if (!t) return { ok: false, m: "Entrez le code reçu par SMS." };
  if (!/^\d{6}$/.test(t)) return { ok: false, m: "Le code doit contenir 6 chiffres." };
  return { ok: true };
}

/** Generic text field (2–200 chars, sanitized). */
export function validateTextField(v: string, label: string, maxLen = 200): { ok: true } | { ok: false; m: string } {
  const t = v.trim();
  if (!t) return { ok: false, m: `Indiquez ${label}.` };
  if (t.length < 2) return { ok: false, m: `${label} est trop court.` };
  if (t.length > maxLen) return { ok: false, m: `${label} est trop long (max ${maxLen} caractères).` };
  if (FORBIDDEN_RE.test(t)) return { ok: false, m: `${label} contient des caractères non autorisés.` };
  return { ok: true };
}
