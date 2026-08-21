import { apiFetch, getSessionToken } from './api';
import type { EnterprisePublic, ProductPublic } from './types';

export type ProductFeedParams = { type?: 'plat' | 'article' | 'all'; promo?: boolean; limit?: number; offset?: number };
export type CatalogSearchType = 'all' | 'plat' | 'article' | 'restaurant' | 'boutique';
export type CatalogSearchResult = { products: ProductPublic[]; enterprises: EnterprisePublic[] };

export function sortEnterprisesByPopularity<T extends { note_moyenne?: number | null; nb_avis?: number | null }>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.note_moyenne ?? 0) - (a.note_moyenne ?? 0) || (b.nb_avis ?? 0) - (a.nb_avis ?? 0));
}

export async function fetchEnterpriseById(id: string): Promise<EnterprisePublic> {
  return apiFetch<EnterprisePublic>(`/api/enterprises/${id}`);
}

export async function fetchProductsForEnterprise(enterpriseId: string): Promise<ProductPublic[]> {
  return apiFetch<ProductPublic[]>(`/api/enterprises/${enterpriseId}/products`);
}

export async function fetchProductFeed(params: ProductFeedParams = {}): Promise<ProductPublic[]> {
  const search = new URLSearchParams();
  if (params.type) search.set('type', params.type);
  if (params.promo) search.set('promo', 'true');
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  const list = await apiFetch<ProductPublic[]>(`/products/feed${qs ? `?${qs}` : ''}`, { timeoutMs: 30_000 });
  return Array.isArray(list) ? list.filter((p) => p.est_disponible !== false) : [];
}

export async function searchCatalog(query: string, type: CatalogSearchType = 'all', limit = 24): Promise<CatalogSearchResult> {
  const q = query.trim();
  if (q.length < 2) return { products: [], enterprises: [] };
  const search = new URLSearchParams();
  search.set('q', q);
  if (type !== 'all') search.set('type', type);
  search.set('limit', String(limit));
  try {
    const results = await apiFetch<CatalogSearchResult>(`/products/search?${search.toString()}`);
    return { products: (results.products ?? []).filter((p) => p.est_disponible !== false), enterprises: results.enterprises ?? [] };
  } catch {
    const [feed, restaurants, boutiques] = await Promise.all([
      fetchProductFeed({ limit: 200 }),
      type === 'all' || type === 'restaurant' ? apiFetch<EnterprisePublic[]>('/api/enterprises/active?type=restaurant') : Promise.resolve([]),
      type === 'all' || type === 'boutique' ? apiFetch<EnterprisePublic[]>('/api/enterprises/active?type=boutique') : Promise.resolve([]),
    ]);
    const needle = q.toLowerCase();
    const matchText = (s: string | null | undefined) => (s ?? '').toLowerCase().includes(needle);
    return {
      products: feed.filter((p) => matchText(p.nom) || matchText(p.description) || matchText(p.enterprise_nom)).slice(0, limit),
      enterprises: [...restaurants, ...boutiques].filter((e) => matchText(e.nom) || matchText(e.description) || matchText(e.adresse)).slice(0, 12),
    };
  }
}

export function trackEnterpriseView(enterpriseId: string, productIds: string[]): void {
  if (!enterpriseId) return;
  const token = getSessionToken();
  apiFetch<void>(`/products/enterprise/${enterpriseId}/views`, { method: 'POST', token, jsonBody: { ids: productIds.filter(Boolean) }, skipIncidentReport: true }).catch(() => {});
}

export function trackProductClick(enterpriseId: string, productId: string): void {
  if (!enterpriseId || !productId) return;
  const token = getSessionToken();
  apiFetch<void>(`/products/enterprise/${enterpriseId}/${productId}/click`, { method: 'POST', token, skipIncidentReport: true }).catch(() => {});
}
