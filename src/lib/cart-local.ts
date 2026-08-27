import type { CartLine, CartSegment, CartState } from './types';
import { safeGetItem, safeSetItem, safeRemoveItem } from './safe-storage';

const CART_KEY = 'golivra_cart_v1';

export type { CartLine, CartSegment, CartState };

export function dedupeLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const l of lines) {
    const existing = map.get(l.productId);
    if (existing) {
      map.set(l.productId, { ...existing, quantite: existing.quantite + l.quantite });
    } else {
      map.set(l.productId, { ...l });
    }
  }
  return [...map.values()];
}

export function loadLocalCart(): CartState {
  try {
    const raw = safeGetItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed?.segments?.length) return null;
    return { segments: parsed.segments.filter((s) => s.lines.length > 0) };
  } catch { return null; }
}

export function saveLocalCart(cart: CartState): void {
  try {
    if (!cart?.segments?.length) { safeRemoveItem(CART_KEY); return; }
    safeSetItem(CART_KEY, JSON.stringify(cart));
  } catch { /* ignore */ }
}

export function clearCart(): void {
  try { safeRemoveItem(CART_KEY); } catch { /* ignore */ }
}
