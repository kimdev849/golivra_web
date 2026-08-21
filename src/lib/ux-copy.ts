/**
 * Textes utilisateur — simples, cohérents, sans jargon technique.
 * Copié depuis golivra_mobile/lib/ux-copy.ts
 */

export const UX_ERRORS: Readonly<Record<string, string>> = {
  network: 'Problème de connexion. Vérifiez votre internet, puis réessayez.',
  generic: 'Une erreur est survenue. Réessayez dans un instant.',
  auth: 'Numéro ou mot de passe incorrect. Vérifiez vos informations, puis réessayez.',
  otp: 'Ce code est invalide ou a expiré. Demandez un nouveau code.',
  session: 'Votre session a expiré. Reconnectez-vous pour continuer.',
  notFound: 'Nous n\'avons pas trouvé ce que vous cherchez.',
  forbidden: 'Vous n\'avez pas la permission de faire cette action.',
  serverOutdated:
    "Cette fonction n'est pas encore disponible. Réessayez dans quelques instants — si le problème persiste, contactez l'assistance.",
};

export function normalizeStatutKey(statut: string | null | undefined): string {
  return (statut ?? '').trim().toLowerCase().replace(/-/g, '_');
}

export function orderStatusLabel(statut: string | null | undefined): string {
  if (!statut?.trim()) return 'En cours';
  const key = normalizeStatutKey(statut);
  const map: Record<string, string> = {
    en_attente: 'En attente',
    commande_creee: 'Commande envoyée',
    partiellement_acceptee: 'Certains commerces ont accepté',
    acceptee: 'Acceptée',
    en_preparation: 'En préparation',
    prete: 'Prête',
    en_livraison: 'En livraison',
    livree: 'Livrée',
    partiellement_livree: 'Une partie est déjà livrée',
    annulee: 'Annulée',
    remboursee: 'Remboursée',
    expiree: 'Expirée',
    en_attente_vendeur: 'En attente du commerce',
    probleme: 'Un problème est survenu',
    refusee: 'Refusée',
  };
  return map[key] ?? 'En cours';
}

export function vendorOrderStatusLabel(statut: string | null | undefined): string {
  const key = normalizeStatutKey(statut) as string;
  const map: Record<string, string> = {
    en_attente: 'Nouvelle commande',
    acceptee: 'Acceptée',
    a_preparer: 'À préparer',
    en_preparation: 'En préparation',
    prete: 'Prête pour le livreur',
    en_livraison: 'En livraison',
    livree: 'Livrée',
    annulee: 'Annulée',
    refusee: 'Refusée',
  };
  return map[key] ?? 'En cours';
}

export function deliveryTrackingLabel(statut: string | null | undefined): string {
  const key = normalizeStatutKey(statut);
  const map: Record<string, string> = {
    en_attente: 'En attente d\'un livreur',
    attribuee: 'Livreur en route vers vous',
    assignee: 'Livreur en route vers vous',
    en_collecte: 'Le livreur arrive',
    collectee: 'Commande récupérée',
    en_route: 'En route vers le client',
    livree: 'Livrée',
    echec: 'Livraison impossible',
    annulee: 'Annulée',
  };
  return map[key] ?? 'Suivi en cours';
}

export function courierMissionStatusLabel(statut: string | null | undefined): string {
  const key = normalizeStatutKey(statut);
  const map: Record<string, string> = {
    en_attente: 'Disponible',
    attribuee: 'À récupérer',
    assignee: 'À récupérer',
    en_collecte: 'Récupération',
    collectee: 'Récupérée',
    en_route: 'En livraison',
    en_cours: 'En livraison',
    livree: 'Terminée',
    terminee: 'Terminée',
    annulee: 'Annulée',
    echec: 'Annulée',
  };
  return map[key] ?? 'En cours';
}

export type CommerceKind = 'boutique' | 'restaurant' | 'commerce';

export function commerceKindWords(kind: CommerceKind | null | undefined) {
  const isBoutique = kind === 'boutique';
  const isResto = kind === 'restaurant';
  return {
    word: isBoutique ? 'la boutique' : isResto ? 'le restaurant' : 'le commerce',
    Who: isBoutique ? 'La boutique' : isResto ? 'Le restaurant' : 'Le commerce',
    il: isBoutique ? 'elle' : 'il',
    de: isBoutique ? 'de la boutique' : isResto ? 'du restaurant' : 'du commerce',
  };
}

export function friendlyErrorMessage(raw: unknown, fallback: string = UX_ERRORS.generic): string {
  const msg = raw instanceof Error ? raw.message : typeof raw === 'string' ? raw : '';
  const trimmed = msg.trim();
  if (!trimmed) return fallback;
  const lower = trimmed.toLowerCase();
  if (/network|fetch|timeout|econnrefused|econnreset/i.test(lower)) return UX_ERRORS.network;
  if (/cannot (get|put|post|patch|delete)\b/i.test(lower)) return UX_ERRORS.serverOutdated;
  if (/session|token|unauthorized|401/i.test(lower)) return UX_ERRORS.session;
  if (/mot de passe|credentials|identifiant|403/i.test(lower)) return UX_ERRORS.auth;
  return trimmed.length > 180 ? trimmed.slice(0, 177) + '…' : trimmed;
}
