import { apiFetch } from './api';

export type VendorOrder = {
  id: string;
  ref: string;
  statut: string;
  prixTotal: number;
  fraisLivraison: number;
  paiement_statut?: string;
  livreur?: { nom: string; tel?: string } | null;
  livraison_statut?: string;
  livraison_id?: string;
  acceptation_limite_at?: string;
  sous_commande_id?: string;
  clientNom: string;
  clientTel: string;
  adresse: string;
  lignes: { id: string; nom: string; quantite: number; prixUnitaire: number; detail?: string }[];
  creeLeLabel: string;
};

export async function fetchVendorOrders(token: string): Promise<VendorOrder[]> {
  return apiFetch<VendorOrder[]>('/api/vendor/orders', { method: 'GET', token });
}

export async function fetchVendorOrder(token: string, orderId: string): Promise<VendorOrder> {
  return apiFetch<VendorOrder>(`/api/vendor/orders/${orderId}`, { method: 'GET', token });
}

export async function updateVendorOrderStatus(token: string, orderId: string, statut: string, sousCommandeId: string, raisonRefus?: string): Promise<void> {
  await apiFetch(`/api/vendor/orders/${orderId}/status`, {
    method: 'PATCH', token,
    jsonBody: { statut, sousCommandeId, raisonRefus },
  });
}

export async function fetchDeliveryStatus(token: string, orderId: string): Promise<{ delivery?: { statut: string } }> {
  return apiFetch(`/api/vendor/orders/${orderId}/delivery-status`, { method: 'GET', token });
}

export async function fetchVendorStats(token: string): Promise<Record<string, unknown>> {
  return apiFetch('/api/vendor/stats', { method: 'GET', token });
}

export async function fetchVendorCatalog(token: string): Promise<Record<string, unknown>[]> {
  return apiFetch('/api/vendor/catalog', { method: 'GET', token });
}

export async function createVendorProduct(token: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/api/vendor/products', { method: 'POST', token, jsonBody: data });
}

export async function updateVendorProduct(token: string, productId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch(`/api/vendor/products/${productId}`, { method: 'PATCH', token, jsonBody: data });
}

export async function deleteVendorProduct(token: string, productId: string): Promise<void> {
  await apiFetch(`/api/vendor/products/${productId}`, { method: 'DELETE', token });
}

export async function fetchVendorShopInfo(token: string): Promise<Record<string, unknown>> {
  return apiFetch('/api/vendor/shop', { method: 'GET', token });
}

export async function updateVendorShopInfo(token: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/api/vendor/shop', { method: 'PATCH', token, jsonBody: data });
}

export async function fetchVendorShopPayments(token: string): Promise<Record<string, unknown>[]> {
  return apiFetch('/api/vendor/shop/payments', { method: 'GET', token });
}

export async function fetchVendorShopAddresses(token: string): Promise<Record<string, unknown>[]> {
  return apiFetch('/api/vendor/shop/addresses', { method: 'GET', token });
}

export async function updateVendorShopAddresses(token: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiFetch('/api/vendor/shop/addresses', { method: 'PATCH', token, jsonBody: data });
}

export async function livraisonStatutLabel(statut: string | null | undefined): Promise<string> {
  const map: Record<string, string> = {
    en_attente: 'En attente d\'un livreur', attribuee: 'Livreur en route',
    en_collecte: 'Le livreur arrive', collectee: 'Récupérée',
    en_route: 'En livraison', livree: 'Livrée', echec: 'Échec', annulee: 'Annulée',
  };
  return map[statut ?? ''] ?? 'Suivi en cours';
}
