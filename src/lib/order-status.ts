import { normalizeStatutKey } from './ux-copy';

export const TERMINAL_ORDER_STATUSES = new Set([
  'livree', 'partiellement_livree', 'annulee', 'refusee', 'remboursee',
]);

export function isActiveOrderStatus(statut: string | null | undefined): boolean {
  if (!statut?.trim()) return false;
  return !TERMINAL_ORDER_STATUSES.has(normalizeStatutKey(statut));
}

export function orderPollingIntervalMs(statut: string | null | undefined): number | false {
  const key = normalizeStatutKey(statut);
  if (TERMINAL_ORDER_STATUSES.has(key)) return false;
  if (['en_livraison', 'collectee', 'en_route', 'en_collecte'].includes(key)) return 5_000;
  if (['en_preparation', 'prete', 'acceptee', 'a_preparer'].includes(key)) return 15_000;
  if (['en_attente_vendeur', 'en_attente', 'commande_creee'].includes(key)) return 30_000;
  return 15_000;
}

export function orderEtaMinutes(statut: string | null | undefined): number | null {
  const key = normalizeStatutKey(statut);
  const map: Record<string, number> = {
    en_attente: 25, commande_creee: 25, partiellement_acceptee: 22,
    acceptee: 20, a_preparer: 18, en_preparation: 15, prete: 12,
    en_collecte: 10, collectee: 8, en_livraison: 8, en_route: 8,
  };
  return map[key] ?? null;
}
