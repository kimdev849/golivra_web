/** Affichage prix en FCFA (données locales). */
export function formatFcfa(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/** Alias pour compatibilité avec les fichiers importés du mobile. */
export function formatPrice(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  return `${Math.round(n).toLocaleString('fr-FR')} FCFA`;
}

export function formatHumanMinutes(minutes: number | null | undefined): string {
  const m = Math.round(Number(minutes));
  if (!Number.isFinite(m) || m <= 0) return 'quelques minutes';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${m} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${String(rest).padStart(2, '0')}`;
}
