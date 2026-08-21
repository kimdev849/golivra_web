type ValidationResult = { ok: true; value: string } | { ok: false; message: string };

function ok(value: string): ValidationResult { return { ok: true, value }; }
function fail(message: string): ValidationResult { return { ok: false, message }; }

const NAME_REGEX = /^[\p{L}0-9@][\p{L}\p{M}0-9\s''\-.,&()@]{0,99}$/u;
const HAS_LETTER = /\p{L}/u;

function validateName(value: string, fieldName: string): ValidationResult {
  const v = value.trim().replace(/\s{2,}/g, ' ');
  if (v.length < 2) return fail(`${fieldName} doit contenir au moins 2 caractères.`);
  if (v.length > 100) return fail(`${fieldName} est trop long (100 caractères max).`);
  if (!HAS_LETTER.test(v)) return fail(`${fieldName} doit contenir au moins une lettre.`);
  if (!NAME_REGEX.test(v)) return fail(`${fieldName} contient des caractères non autorisés.`);
  return ok(v);
}

function validatePrice(value: string): ValidationResult {
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return fail('Prix invalide.');
  if (n < 10) return fail('Le prix minimum est 10 FCFA.');
  if (n > 999_999_999) return fail('Le prix est trop élevé.');
  return ok(String(n));
}

export function validateVendorProductForm(form: { nom: string; prix: string }): string | null {
  const nom = validateName(form.nom, 'Nom du produit');
  if (!nom.ok) return nom.message;
  const prix = validatePrice(form.prix);
  if (!prix.ok) return prix.message;
  return null;
}
