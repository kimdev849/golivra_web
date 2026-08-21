import type { CartLine, CartSegment, CartState } from './types';

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
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed?.segments?.length) return null;
    return { segments: parsed.segments.filter((s) => s.lines.length > 0) };
  } catch { return null; }
}

export function saveLocalCart(cart: CartState): void {
  try {
    if (!cart?.segments?.length) { localStorage.removeItem(CART_KEY); return; }
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch { /* ignore */ }
}

export function clearCart(): void {
  try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
}
