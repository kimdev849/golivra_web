import { getSessionToken } from './api';
import { safeGetItem, safeSetItem } from './safe-storage';
import { fetchFavorites, fetchFavoriteProducts, syncFavoritesRemote, toggleFavoriteProductRemote, toggleFavoriteRemote } from './favorites-api';

const STORAGE_KEY = 'golivra_client_favorites_v1';
const STORAGE_KEY_PRODUCTS = 'golivra_client_favorite_products_v1';

export type FavoriteProductRef = { produit_id: string; produit_kind: 'plat' | 'article' };

function readIds(): string[] {
  try {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [];
  } catch { return []; }
}

function writeIds(ids: string[]): void {
  try { safeSetItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

function readProductRefs(): FavoriteProductRef[] {
  try {
    const raw = safeGetItem(STORAGE_KEY_PRODUCTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x: unknown) =>
      typeof x === 'object' && x !== null && typeof (x as FavoriteProductRef).produit_id === 'string'
    ) : [];
  } catch { return []; }
}

function writeProductRefs(refs: FavoriteProductRef[]): void {
  try { safeSetItem(STORAGE_KEY_PRODUCTS, JSON.stringify(refs)); } catch { /* ignore */ }
}

export function getFavoriteEnterpriseIds(): string[] {
  const token = getSessionToken();
  if (token) {
    fetchFavorites(token).then((remote) => writeIds(remote.enterprise_ids ?? [])).catch(() => {});
  }
  return readIds();
}

export function isFavoriteEnterprise(id: string): boolean {
  return readIds().includes(id);
}

export async function toggleFavoriteEnterpriseId(id: string, enterpriseType?: 'restaurant' | 'boutique'): Promise<boolean> {
  const token = getSessionToken();
  if (token) {
    try {
      const res = await toggleFavoriteRemote(token, id, enterpriseType);
      const ids = readIds();
      const next = res.favori ? [...new Set([...ids, id])] : ids.filter((x) => x !== id);
      writeIds(next);
      return res.favori;
    } catch { /* fallback local */ }
  }
  const ids = readIds();
  const has = ids.includes(id);
  writeIds(has ? ids.filter((x) => x !== id) : [...ids, id]);
  return !has;
}

export function getFavoriteProducts(): FavoriteProductRef[] {
  const token = getSessionToken();
  if (token) {
    fetchFavoriteProducts(token).then((remote) => writeProductRefs(remote.items ?? [])).catch(() => {});
  }
  return readProductRefs();
}

export function isFavoriteProduct(productId: string, kind: 'plat' | 'article'): boolean {
  return readProductRefs().some((r) => r.produit_id === productId && r.produit_kind === kind);
}

export async function toggleFavoriteProduct(productId: string, kind: 'plat' | 'article'): Promise<boolean> {
  const token = getSessionToken();
  const ref: FavoriteProductRef = { produit_id: productId, produit_kind: kind };
  if (token) {
    try {
      const res = await toggleFavoriteProductRemote(token, productId, kind);
      const current = readProductRefs();
      const key = `${ref.produit_kind}:${ref.produit_id}`;
      const has = current.some((r) => `${r.produit_kind}:${r.produit_id}` === key);
      writeProductRefs(res.favori ? (has ? current : [...current, ref]) : current.filter((r) => `${r.produit_kind}:${r.produit_id}` !== key));
      return res.favori;
    } catch { /* fallback local */ }
  }
  const refs = readProductRefs();
  const key = `${ref.produit_kind}:${ref.produit_id}`;
  const has = refs.some((r) => `${r.produit_kind}:${r.produit_id}` === key);
  writeProductRefs(has ? refs.filter((r) => `${r.produit_kind}:${r.produit_id}` !== key) : [...refs, ref]);
  return !has;
}
