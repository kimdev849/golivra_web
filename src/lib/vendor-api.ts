import { apiFetch } from './api';

// ─── CORRECT API endpoints (matching golivra_mobile/lib/vendor-api.ts) ───────

export type VendorShop = {
  id: string;
  nom: string;
  type?: string;
  image_url?: string;
  ouvert?: boolean;
  statut_moderation?: string;
};

/** GET /api/enterprises/mine — fetch vendor's own shops (mobile: enterprise.ts:93) */
export async function fetchVendorShops(token: string): Promise<VendorShop[]> {
  const data = await apiFetch<VendorShop[]>('/api/enterprises/mine', { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

/** GET /api/orders/vendor/mine — fetch vendor orders (mobile: vendor-api.ts:180) */
export async function fetchVendorOrders(token: string): Promise<any[]> {
  const data = await apiFetch<any[]>('/api/orders/vendor/mine', { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

/** GET /api/orders/vendor/{orderId} — fetch single vendor order */
export async function fetchVendorOrder(token: string, orderId: string): Promise<any> {
  return apiFetch(`/api/orders/vendor/${orderId}`, { method: 'GET', token });
}

/** PATCH /api/orders/vendor/{orderId}/status — update order status */
export async function updateVendorOrderStatus(
  token: string,
  orderId: string,
  statut: string,
  sousCommandeId: string,
  raisonRefus?: string,
): Promise<void> {
  await apiFetch(`/api/orders/vendor/${orderId}/status`, {
    method: 'PATCH', token,
    jsonBody: { statut, sousCommandeId, raisonRefus },
  });
}

/** GET /api/products/enterprise/{enterpriseId} — fetch vendor products (mobile: vendor-api.ts:99) */
export async function fetchVendorProducts(token: string, enterpriseId: string): Promise<any[]> {
  const data = await apiFetch<any[]>(`/api/products/enterprise/${enterpriseId}`, { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

/** POST /api/products/enterprise/{enterpriseId} — create product */
export async function createVendorProduct(token: string, enterpriseId: string, body: Record<string, unknown>): Promise<any> {
  return apiFetch(`/api/products/enterprise/${enterpriseId}`, { method: 'POST', token, jsonBody: body });
}

/** PATCH /api/products/enterprise/{enterpriseId}/{productId} — update product */
export async function updateVendorProduct(token: string, enterpriseId: string, productId: string, body: Record<string, unknown>): Promise<any> {
  return apiFetch(`/api/products/enterprise/${enterpriseId}/${productId}`, { method: 'PATCH', token, jsonBody: body });
}

/** DELETE /api/products/enterprise/{enterpriseId}/{productId} — delete product */
export async function deleteVendorProduct(token: string, enterpriseId: string, productId: string): Promise<void> {
  await apiFetch(`/api/products/enterprise/${enterpriseId}/${productId}`, { method: 'DELETE', token });
}

/** GET /api/enterprises/{id}/stats — vendor stats */
export async function fetchVendorStats(token: string, enterpriseId: string): Promise<Record<string, unknown>> {
  return apiFetch(`/api/enterprises/${enterpriseId}/stats`, { method: 'GET', token });
}

/** GET /api/enterprises/{id} — shop info */
export async function fetchVendorShopInfo(token: string, enterpriseId: string): Promise<any> {
  return apiFetch(`/api/enterprises/${enterpriseId}`, { method: 'GET', token });
}

/** PATCH /api/enterprises/{id} — update shop info */
export async function updateVendorShopInfo(token: string, enterpriseId: string, data: Record<string, unknown>): Promise<any> {
  return apiFetch(`/api/enterprises/${enterpriseId}`, { method: 'PATCH', token, jsonBody: data });
}

/** GET /api/enterprises/{id}/horaires — shop hours */
export async function fetchVendorHoraires(token: string, enterpriseId: string): Promise<any[]> {
  const data = await apiFetch(`/api/enterprises/${enterpriseId}/horaires`, { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}

/** PATCH /api/enterprises/{id}/horaires — update shop hours */
export async function updateVendorHoraires(token: string, enterpriseId: string, data: any[]): Promise<any> {
  return apiFetch(`/api/enterprises/${enterpriseId}/horaires`, { method: 'PATCH', token, jsonBody: data });
}

/** GET /api/delivery/vendor/externe — external deliveries */
export async function fetchVendorExternalDeliveries(token: string, opts?: { active?: boolean }): Promise<any[]> {
  const qs = opts?.active ? '?active=true' : '';
  const data = await apiFetch<any[]>(`/api/delivery/vendor/externe${qs}`, { method: 'GET', token });
  return Array.isArray(data) ? data : [];
}
